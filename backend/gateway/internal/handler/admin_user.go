package handler

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AdminUserHandler struct {
	userRepo adminUserStore
	auditLog auditLogger
	attempts totpAttemptLimiter // jatah bersama faktor kedua; nil = ganti sandi sendiri 503
	clock    func() time.Time   // nil = time.Now
}

func NewAdminUserHandler(userRepo *repository.AdminUserRepo, auditLog *repository.AuditLogRepo, attempts totpAttemptLimiter) *AdminUserHandler {
	return &AdminUserHandler{userRepo: userRepo, auditLog: auditLog, attempts: attempts}
}

func (h *AdminUserHandler) now() time.Time {
	if h.clock != nil {
		return h.clock()
	}
	return time.Now()
}

// ───────────────────────── sesi kuat ─────────────────────────
//
// TOTP seorang admin hanya berarti bila tidak bisa dilucuti oleh sesi yang lebih
// lemah, dan sesi yang lemah tidak bisa MENCETAK sesi kuat sendiri. Rantai yang
// ditutup (putaran 2 dan 3): sesi mfa=false milik super admin tanpa TOTP (token
// curian tanpa sandi, atau sandi bocor) → membuat super admin baru / mengganti
// sandi sendiri / mengganti sandi super admin lain → login dengan sandi pilihan
// pelaku → mendaftarkan TOTP → sesi mfa=true dalam semenit → mereset TOTP dan
// sandi Master → login sebagai Master.
//
// "Sesi kuat" = sesi mfa=true yang masih segar (auth.MFAMaxAge) milik admin yang
// TOTP-nya aktif DAN akun serta pendaftaran TOTP-nya lebih tua dari
// mfaEnrollmentGrace. Pendaftaran TOTP yang baru (oleh siapa pun) tidak memberi
// kuasa atas admin lain sebelum masa tenggang lewat, dan setiap pendaftaran
// tercatat di audit (totp_setup, totp_enable) selama masa itu.
//
// Butuh sesi kuat:
//   - mengubah (kolom apa pun), menghapus, atau mereset TOTP admin lain yang
//     TOTP-nya aktif;
//   - memberi peran super admin (buat baru atau naikkan), dan menyetel sandi
//     super admin lain — begitu ada satu saja admin ber-TOTP (sebelum itu masa
//     transisi: tidak ada TOTP yang bisa dilucuti).
// Akun sendiri yang ber-TOTP cukup sesi ber-MFA segar. Mengganti sandi sendiri
// butuh sandi saat ini (current_password) begitu ada satu saja admin ber-TOTP
// (masa transisi: lihat Update). Pengecualian: revoke-sessions,
// karena sifatnya defensif (runbook "token bocor" langkah 0) dan korban cukup
// login ulang memakai sandi + TOTP.

// roleSuperAdmin: peran dengan semua izin (rbac.rolePermissions).
const roleSuperAdmin = "super_admin"

// mfaEnrollmentGrace: umur minimal akun dan pendaftaran TOTP pelaku untuk sesi
// kuat. Hanya untuk sesi kuat: izin CashFlow T1+ di Nitro TIDAK memakai masa
// tenggang (keputusan Master 21 Sep 2026; landing utils/rbac.ts).
const mfaEnrollmentGrace = 24 * time.Hour

// errMFARequired: 403. Frontend menampilkan pesannya; login ulang memakai TOTP
// menghasilkan sesi yang lolos.
func errMFARequired(msg string) *apperr.AppError {
	return &apperr.AppError{Code: "MFA_REQUIRED", Message: msg, HTTPStatus: http.StatusForbidden}
}

// errMFAEnrollmentTooRecent: 403. Sesinya lolos TOTP, tetapi akun atau
// pendaftaran TOTP pelaku lebih muda dari mfaEnrollmentGrace.
func errMFAEnrollmentTooRecent() *apperr.AppError {
	return &apperr.AppError{
		Code: "MFA_ENROLLMENT_TOO_RECENT",
		Message: "TOTP atau akun Anda terdaftar kurang dari 24 jam lalu. Mengelola admin ber-TOTP, memberi peran super admin, " +
			"atau menyetel sandi super admin lain baru bisa setelah 24 jam sejak TOTP Anda aktif.",
		HTTPStatus: http.StatusForbidden,
	}
}

// requireStrongSession menolak (dan mengaudit) sesi yang tidak kuat.
func (h *AdminUserHandler) requireStrongSession(c fiber.Ctx, claims *auth.Claims, targetID, email, action string) *apperr.AppError {
	now := h.now()
	if !claims.HasFreshMFA(now) {
		h.logMFADenied(c, claims, targetID, email, action, "sesi tanpa MFA")
		return errMFARequired("Tindakan ini butuh sesi yang lolos TOTP: aktifkan TOTP di akun Anda lalu login ulang memakai TOTP.")
	}
	actor := middleware.GetLiveUser(c)
	if actor == nil || !actor.TOTPEnabled() {
		// nil: rute tanpa RequireLiveSession (salah rakit). TOTP mati: dimatikan
		// di luar alur yang menaikkan token_version (mis. SQL). Gagal tertutup.
		h.logMFADenied(c, claims, targetID, email, action, "TOTP pelaku tidak aktif")
		return errMFARequired("Tindakan ini butuh sesi yang lolos TOTP: login ulang memakai TOTP.")
	}
	if now.Sub(*actor.TOTPEnabledAt) < mfaEnrollmentGrace || now.Sub(actor.CreatedAt) < mfaEnrollmentGrace {
		h.logMFADenied(c, claims, targetID, email, action, "pendaftaran TOTP atau akun pelaku < 24 jam")
		return errMFAEnrollmentTooRecent()
	}
	return nil
}

// requireMFAForTarget: target ber-TOTP. Admin lain → sesi kuat; akun sendiri →
// cukup sesi ber-MFA segar (pendaftarannya sendiri tidak memberi kuasa baru).
func (h *AdminUserHandler) requireMFAForTarget(c fiber.Ctx, claims *auth.Claims, target *model.AdminUser, action string) *apperr.AppError {
	if !target.TOTPEnabled() {
		return nil
	}
	if target.ID != claims.UserID {
		return h.requireStrongSession(c, claims, target.ID.String(), target.Email, action)
	}
	if claims.HasFreshMFA(h.now()) {
		return nil
	}
	h.logMFADenied(c, claims, target.ID.String(), target.Email, action, "sesi tanpa MFA")
	return errMFARequired("Akun Anda memakai TOTP. Mengubahnya butuh sesi yang lolos TOTP: login ulang memakai TOTP.")
}

// requireStrongForSuperAdminCredential: memberi peran super admin atau menyetel
// sandi super admin lain. Selama belum ada satu pun admin ber-TOTP (transisi),
// tidak ada TOTP yang bisa dilucuti dan tidak ada sesi kuat yang mungkin, jadi
// aturan ini belum berlaku. Galat DB = gagal tertutup.
func (h *AdminUserHandler) requireStrongForSuperAdminCredential(c fiber.Ctx, claims *auth.Claims, targetID, email, action string) *apperr.AppError {
	inForce, err := h.userRepo.AnyTOTPEnabled(c.Context())
	if err != nil {
		slog.Error("admin: gagal memeriksa apakah ada admin ber-TOTP", "error", err)
		return apperr.NewInternal(err)
	}
	if !inForce {
		return nil
	}
	return h.requireStrongSession(c, claims, targetID, email, action)
}

func (h *AdminUserHandler) logMFADenied(c fiber.Ctx, claims *auth.Claims, targetID, email, action, reason string) {
	ip := middleware.ClientIP(c)
	slog.Warn("admin: operasi ditolak, sesi tidak cukup kuat",
		"aksi", action, "alasan", reason, "pelaku_id", claims.UserID, "target_id", targetID, "target_email", email, "ip", ip)
	desc := "Ditolak (" + reason + "): " + action + " atas admin user " + email
	var resID *string
	if targetID != "" {
		resID = &targetID
	}
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "mfa_required_denied", "admin_users", resID, &desc, ip)
}

// errAdminChanged: 409. Baris admin berubah (sesi dicabut, sandi, status, atau
// peran diganti) di antara dimuat dan ditulis; tidak ada yang ditulis.
func errAdminChanged() *apperr.AppError {
	return apperr.NewConflict("Data admin ini baru saja berubah (mis. sesinya dicabut atau sandinya diganti). Muat ulang halaman lalu ulangi.")
}

// errEmailTaken: 409, sama untuk Create dan Update. Email dibandingkan tanpa
// peka huruf dan spasi tepi.
func errEmailTaken() *apperr.AppError {
	return apperr.NewConflict("Email sudah terdaftar")
}

// errCurrentPasswordRequired: mengganti sandi sendiri tanpa current_password.
// Pesannya dibaca manusia di console, jadi tanpa nama field.
func errCurrentPasswordRequired() *apperr.AppError {
	return &apperr.AppError{
		Code:       "CURRENT_PASSWORD_REQUIRED",
		Message:    "Mengganti sandi akun sendiri butuh sandi saat ini.",
		HTTPStatus: http.StatusBadRequest,
	}
}

// verifyCurrentPassword: sandi saat ini untuk mengganti sandi sendiri. Tanpa
// ini, access token atau cookie curian cukup untuk mengganti sandi pemiliknya,
// lalu melewati syarat sandi di /totp/setup. Setiap percobaan memakai jatah
// faktor kedua yang sama dengan /totp/setup (gagal tertutup, diaudit).
func (h *AdminUserHandler) verifyCurrentPassword(c fiber.Ctx, user *model.AdminUser, current *string) *apperr.AppError {
	if current == nil || *current == "" {
		return errCurrentPasswordRequired()
	}
	res, appErr := takeAttempt(c, h.attempts, user.ID)
	if appErr != nil {
		return appErr
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(*current)); err != nil {
		if !errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			// Hash tersimpan rusak: galat server, bukan sandi salah.
			refundAttempt(c, h.attempts, h.auditLog, user, "ganti_sandi_sendiri", causePasswordHashCorrupt, err)
			return apperr.NewInternal(err)
		}
		auditRejectedAttempt(c, h.auditLog, user, "ganti_sandi_sendiri", res)
		return errPasswordInvalid()
	}
	releaseAttempt(c, h.attempts, user.ID)
	return nil
}

func (h *AdminUserHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))

	users, total, err := h.userRepo.FindAll(c.Context(), page, perPage)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}

	responses := make([]model.AdminUserResponse, len(users))
	for i, u := range users {
		responses[i] = u.ToResponse()
	}

	return paginated(c, responses, total, page, perPage)
}

func (h *AdminUserHandler) Create(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var req model.CreateAdminRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	req.Email = model.NormalizeEmail(req.Email)
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	if req.Role == roleSuperAdmin {
		if appErr := h.requireStrongForSuperAdminCredential(c, claims, "", req.Email, "grant_super_admin"); appErr != nil {
			return errResponse(c, appErr)
		}
	}

	existing, err := h.userRepo.FindByEmail(c.Context(), req.Email)
	if err != nil {
		slog.Error("admin: gagal memeriksa email", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if existing != nil {
		return errResponse(c, errEmailTaken())
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}

	user := &model.AdminUser{
		Email:        req.Email,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Role:         req.Role,
		IsActive:     true,
	}

	if err := h.userRepo.Create(c.Context(), user); err != nil {
		if errors.Is(err, repository.ErrEmailTaken) {
			return errResponse(c, errEmailTaken())
		}
		slog.Error("gagal buat admin user", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := user.ID.String()
	desc := "Membuat admin user: " + user.Email
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "create", "admin_users", &resID, &desc, middleware.ClientIP(c))

	return created(c, user.ToResponse())
}

func (h *AdminUserHandler) Update(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	user, err := h.userRepo.FindByID(c.Context(), id)
	if err != nil || user == nil {
		return errResponse(c, apperr.NewNotFound("Admin user"))
	}
	self := user.ID == claims.UserID
	// Akun sendiri: baris yang baru dimuat harus masih sesi yang sama dengan
	// yang lolos RequireLiveSession. Kalau sesi ini dicabut di antara keduanya
	// (mis. dinonaktifkan super admin), permintaan ini tidak boleh menulis
	// apa pun, termasuk is_active:true yang dikirim eksplisit.
	if self && (!user.IsActive || user.TokenVersion != claims.TV) {
		return errResponse(c, middleware.ErrSessionRevoked())
	}
	if appErr := h.requireMFAForTarget(c, claims, user, "update"); appErr != nil {
		return errResponse(c, appErr)
	}

	var req model.UpdateAdminRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	// Aturan isian sama dengan Create (email, peran, nama, kekuatan sandi).
	if req.Email != nil {
		e := model.NormalizeEmail(*req.Email)
		req.Email = &e
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}
	// Email adalah identitas admin di luar gateway (pelaku sesi console
	// CashFlow, pencabutan sesi per email): harus unik tanpa peka huruf.
	// Diperiksa sebelum sandi saat ini, supaya permintaan yang ditolak tidak
	// memakai jatah percobaan.
	emailChanged := req.Email != nil && *req.Email != model.NormalizeEmail(user.Email)
	if emailChanged {
		other, err := h.userRepo.FindByEmail(c.Context(), *req.Email)
		if err != nil {
			slog.Error("admin: gagal memeriksa email", "error", err)
			return errResponse(c, apperr.NewInternal(err))
		}
		if other != nil && other.ID != user.ID {
			return errResponse(c, errEmailTaken())
		}
	}

	// Kredensial super admin: memberi peran super admin, atau menyetel sandi
	// super admin lain (sandi pilihan pelaku = akun yang bisa ia daftarkan TOTP-nya).
	// Target ber-TOTP sudah menuntut sesi kuat di requireMFAForTarget.
	grant := req.Role != nil && *req.Role == roleSuperAdmin && user.Role != roleSuperAdmin
	setSuperPassword := req.Password != nil && !self && (user.Role == roleSuperAdmin || grant)
	if (grant || setSuperPassword) && !(user.TOTPEnabled() && !self) {
		action := "grant_super_admin"
		if !grant {
			action = "set_super_admin_password"
		}
		if appErr := h.requireStrongForSuperAdminCredential(c, claims, user.ID.String(), user.Email, action); appErr != nil {
			return errResponse(c, appErr)
		}
	}
	// Sandi sendiri: wajib sandi saat ini begitu ada satu saja admin ber-TOTP.
	// Diperiksa paling akhir, setelah semua syarat izin, supaya permintaan yang
	// ditolak tidak memakai jatah percobaan.
	if self && req.Password != nil {
		need := req.CurrentPassword != nil && *req.CurrentPassword != ""
		if !need {
			// Masa transisi (belum ada admin ber-TOTP): console yang sedang tayang
			// belum punya kolom sandi saat ini, dan di masa itu sesi super admin
			// mana pun sudah bisa membuat super admin baru atau menyetel sandi
			// super admin lain tanpa sandi lama. Syarat ini baru melindungi setelah
			// TOTP pertama aktif, sama dengan requireStrongForSuperAdminCredential.
			// current_password yang dikirim selalu diperiksa. Galat DB = 500.
			inForce, err := h.userRepo.AnyTOTPEnabled(c.Context())
			if err != nil {
				slog.Error("admin: gagal memeriksa apakah ada admin ber-TOTP", "error", err)
				return errResponse(c, apperr.NewInternal(err))
			}
			need = inForce
		}
		if need {
			if appErr := h.verifyCurrentPassword(c, user, req.CurrentPassword); appErr != nil {
				return errResponse(c, appErr)
			}
		}
	}

	// Menonaktifkan admin, mengganti sandinya, perannya, atau emailnya ikut
	// mencabut semua sesinya (token_version+1): token lama langsung ditolak
	// /auth/me, /auth/refresh, dan rute ber-RequireLiveSession, mengaktifkan
	// kembali akun tidak menghidupkan token lama, dan token tidak membawa peran
	// lama (klaim role) setelah diturunkan. Email: sesi yang dicetak atas email
	// lama (mis. sesi console CashFlow) tidak boleh terus hidup di bawah
	// identitas yang sudah diganti, dan ganti email tidak boleh menjadi cara
	// memperoleh identitas baru tanpa login ulang.
	revoke := (user.IsActive && req.IsActive != nil && !*req.IsActive) ||
		req.Password != nil ||
		(req.Role != nil && *req.Role != user.Role) ||
		emailChanged

	oldEmail := user.Email
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.FullName != nil {
		user.FullName = *req.FullName
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	if req.Password != nil {
		hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return errResponse(c, apperr.NewInternal(err))
		}
		user.PasswordHash = string(hash)
	}

	// Satu statement: tulis hanya bila token_version belum berubah sejak baris
	// dimuat, dan naikkan token_version bila revoke. Permintaan yang memuat baris
	// sebelum penonaktifan / ganti sandi / ganti peran lalu menulis sesudahnya
	// ditolak (409), tidak mengembalikan kolom lama.
	updated, err := h.userRepo.Update(c.Context(), user, revoke)
	if errors.Is(err, repository.ErrEmailTaken) {
		return errResponse(c, errEmailTaken())
	}
	if err != nil {
		slog.Error("gagal update admin user", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !updated {
		slog.Warn("admin: update ditolak, baris berubah sejak dimuat", "pelaku_id", claims.UserID, "target_id", user.ID)
		return errResponse(c, errAdminChanged())
	}
	if req.Password != nil {
		// Sandi lama (yang mungkin dipegang pelaku) tidak berlaku lagi: buka
		// kunci faktor kedua akun ini.
		clearAttempts(c, h.attempts, user.ID)
	}

	resID := user.ID.String()
	desc := "Mengupdate admin user: " + user.Email
	if emailChanged {
		desc += " (email lama: " + oldEmail + ")"
	}
	if revoke {
		desc += " (semua sesi dicabut)"
	}
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "update", "admin_users", &resID, &desc, middleware.ClientIP(c))

	return ok(c, user.ToResponse())
}

// RevokeSessions mencabut semua sesi admin lain (token_version+1) tanpa
// menonaktifkan akunnya. Runbook "token console bocor" langkah 0.
//
// Sengaja TIDAK menuntut sesi mfa=true untuk target ber-TOTP: tindakan ini
// defensif (tidak memberi akses apa pun ke pelaku), korban cukup login ulang
// memakai sandi + TOTP, dan super admin yang belum ber-TOTP tetap bisa
// menjalankan runbook saat token admin ber-TOTP bocor.
func (h *AdminUserHandler) RevokeSessions(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	user, err := h.userRepo.FindByID(c.Context(), id)
	if err != nil || user == nil {
		return errResponse(c, apperr.NewNotFound("Admin user"))
	}

	if _, err := h.userRepo.BumpTokenVersion(c.Context(), id); err != nil {
		slog.Error("gagal mencabut sesi admin user", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := id.String()
	desc := "Mencabut semua sesi admin user: " + user.Email
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "revoke_sessions", "admin_users", &resID, &desc, middleware.ClientIP(c))

	return ok(c, fiber.Map{"id": id, "sessions_revoked": true})
}

// ResetTOTP mematikan TOTP admin lain (perangkat hilang, atau authenticator
// dipasang orang lain) dan mencabut semua sesinya. Pengganti UPDATE SQL manual
// di VPS. Untuk akun sendiri tidak berlaku: pemilik memakai /auth/totp/disable,
// yang menuntut sesi ber-MFA dan kode sah, supaya token curian milik super
// admin tidak bisa melepas TOTP pemiliknya sendiri lewat jalur ini.
//
// TOTP yang aktif hanya bisa direset dari sesi kuat (requireMFAForTarget).
// Pendaftaran yang belum aktif (totp_pending_enc) boleh direset sesi mana pun.
// Reset juga membuka kunci percobaan faktor kedua akun itu.
func (h *AdminUserHandler) ResetTOTP(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}
	if id == claims.UserID {
		return errResponse(c, apperr.NewBadRequest("Untuk akun sendiri, matikan TOTP lewat /api/admin/auth/totp/disable"))
	}

	user, err := h.userRepo.FindByID(c.Context(), id)
	if err != nil || user == nil {
		return errResponse(c, apperr.NewNotFound("Admin user"))
	}
	if appErr := h.requireMFAForTarget(c, claims, user, "totp_reset"); appErr != nil {
		return errResponse(c, appErr)
	}
	wasEnabled := user.TOTPEnabled()

	done, err := h.userRepo.ResetTOTP(c.Context(), id)
	if err != nil {
		slog.Error("gagal mereset TOTP admin user", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !done {
		return errResponse(c, apperr.NewNotFound("Admin user"))
	}

	clearAttempts(c, h.attempts, id)

	resID := id.String()
	desc := "Mereset TOTP admin user: " + user.Email + " (semua sesi dicabut)"
	if !wasEnabled {
		desc = "Mereset pendaftaran TOTP (belum aktif) admin user: " + user.Email + " (semua sesi dicabut)"
	}
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "totp_reset", "admin_users", &resID, &desc, middleware.ClientIP(c))

	return ok(c, fiber.Map{"id": id, "totp_enabled": false, "sessions_revoked": true})
}

func (h *AdminUserHandler) Delete(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	if id == claims.UserID {
		return errResponse(c, apperr.NewBadRequest("Tidak dapat menghapus akun sendiri"))
	}

	user, err := h.userRepo.FindByID(c.Context(), id)
	if err != nil || user == nil {
		return errResponse(c, apperr.NewNotFound("Admin user"))
	}
	if appErr := h.requireMFAForTarget(c, claims, user, "delete"); appErr != nil {
		return errResponse(c, appErr)
	}

	if err := h.userRepo.Delete(c.Context(), id); err != nil {
		slog.Error("gagal hapus admin user", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := id.String()
	desc := "Menghapus admin user: " + user.Email
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "delete", "admin_users", &resID, &desc, middleware.ClientIP(c))

	return c.Status(fiber.StatusNoContent).Send(nil)
}
