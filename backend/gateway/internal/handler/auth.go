package handler

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/rbac"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// adminUserStore adalah bagian *repository.AdminUserRepo yang dipakai handler
// auth dan manajemen admin. Interface supaya alurnya bisa diuji dengan
// repositori in-memory tanpa DB.
type adminUserStore interface {
	FindByEmail(ctx context.Context, email string) (*model.AdminUser, error)
	FindByID(ctx context.Context, id uuid.UUID) (*model.AdminUser, error)
	FindAll(ctx context.Context, page, perPage int) ([]model.AdminUser, int, error)
	Create(ctx context.Context, u *model.AdminUser) error
	Update(ctx context.Context, u *model.AdminUser, revoke bool) (bool, error)
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateLastLogin(ctx context.Context, id uuid.UUID) error
	BumpTokenVersion(ctx context.Context, id uuid.UUID) (int, error)
	SetTOTPPending(ctx context.Context, id uuid.UUID, enc string) (bool, error)
	EnableTOTP(ctx context.Context, id uuid.UUID, pendingEnc string, step int64) (bool, error)
	DisableTOTP(ctx context.Context, id uuid.UUID, step int64) (bool, error)
	ConsumeTOTPStep(ctx context.Context, id uuid.UUID, step int64) (bool, error)
	ResetTOTP(ctx context.Context, id uuid.UUID) (bool, error)
	AnyTOTPEnabled(ctx context.Context) (bool, error)
}

// totpAttemptLimiter membatasi percobaan faktor kedua per admin (implementasi
// produksi: auth.RedisTOTPLimiter, dua lapis). Take memesan satu jatah secara
// atomik SEBELUM kode/sandi dievaluasi; Reset dipanggil setelah berhasil
// (jendela pendek kosong, jatah panjang milik percobaan itu kembali); Refund
// mengembalikan jatah percobaan yang gagal karena galat server, bukan karena
// kodenya salah; Clear membuka kunci (pemulihan oleh super admin). Tidak ada
// operasi "catat gagal" terpisah: jatah sudah terpakai sejak dipesan, jadi
// permintaan paralel tidak bisa menyelinap di antara cek dan catat, dan galat
// tulis tidak bisa membuat hitungan diam di tempat.
type totpAttemptLimiter interface {
	Take(ctx context.Context, userID uuid.UUID) (auth.AttemptResult, error)
	Reset(ctx context.Context, userID uuid.UUID) error
	Refund(ctx context.Context, userID uuid.UUID) error
	Clear(ctx context.Context, userID uuid.UUID) error
}

// loginAttemptLimiter membatasi percobaan sandi /login per akun (implementasi
// produksi: auth.NewRedisLoginLimiter, kunci auth.LoginAttemptKey(email)).
// Semantiknya sama dengan totpAttemptLimiter: pesan dulu, baru evaluasi.
// KnownOrigin/RememberOrigin (kunci auth.LoginOriginKey(email, IP klien)):
// asal yang pernah memasukkan sandi benar untuk email itu tidak ikut dikunci.
type loginAttemptLimiter interface {
	TakeKey(ctx context.Context, key string) (allowed bool, n int64, retry time.Duration, err error)
	ResetKey(ctx context.Context, key string) error
	KnownOrigin(ctx context.Context, key string) (bool, error)
	RememberOrigin(ctx context.Context, key string) error
}

// Batas percobaan per admin (kode TOTP di verify/enable/disable, sandi
// konfirmasi di setup dan saat mengganti sandi sendiri; satu jatah bersama).
// Dipakai server.go saat merakit limiter.
//
// Lapis pendek menahan tebakan beruntun. Lapis panjang membatasi total tebakan:
// tanpa itu pemegang sandi mendapat 5 × 96 = 480 tebakan per hari selamanya
// (peluang tembus ±3/10^6 per tebakan: ±4% sebulan, ±41% setahun). Dengan 20
// per 30 hari: paling banyak ±0,006% per 30 hari, lalu terkunci sampai super
// admin membukanya (reset TOTP atau ganti sandi) atau jendelanya habis.
const (
	totpMaxFailures       = 5
	totpFailureWindow     = 15 * time.Minute
	totpMaxFailuresLong   = 20
	totpFailureWindowLong = 30 * 24 * time.Hour
)

// Batas percobaan sandi /login per akun (per email, terdaftar atau tidak), di
// luar batas per IP (5 per 15 menit). Satu IP tidak pernah mencapainya sendiri,
// jadi admin yang salah ketik hanya bertemu batas per IP; yang dihentikan
// adalah tebakan sandi dari banyak IP ke satu akun.
//
// Batas ini bisa dihabiskan siapa pun yang tahu email admin (cukup 2 IP), dan
// diulang terus. Supaya pemilik akun tidak terkunci selama serangan berlangsung,
// asal (email + IP klien, IPv6 per /64) yang memasukkan sandi benar dalam
// loginOriginTTL terakhir tidak dikenai batas per akun; batas per IP tetap
// berlaku. Asal baru tetap tertahan, jadi jumlah tebakan dari banyak IP tetap
// terbatas: loginMaxFailures per jendela + batas per IP untuk tiap asal yang
// pernah login benar.
const (
	loginMaxFailures   = 10
	loginFailureWindow = 15 * time.Minute
	loginOriginTTL     = 30 * 24 * time.Hour
)

type AuthHandler struct {
	userRepo      adminUserStore
	auditLog      auditLogger
	jwt           *auth.JWTProvider
	totp          *auth.TOTPCipher    // nil = fitur TOTP tidak tersedia (JWT secret kosong)
	attempts      totpAttemptLimiter  // nil = verifikasi TOTP tidak tersedia
	loginAttempts loginAttemptLimiter // nil = tanpa batas per akun (hanya batas per IP)
	// now: jam untuk evaluasi kode TOTP; hanya dipanggil tepat sebelum
	// auth.VerifyTOTP (uji menghitung evaluasi lewat jam ini).
	now func() time.Time
	// clock: jam dinding untuk umur sesi ber-MFA (sama dengan jam JWT). nil = time.Now.
	clock func() time.Time
}

func (h *AuthHandler) wallNow() time.Time {
	if h.clock != nil {
		return h.clock()
	}
	return time.Now()
}

func NewAuthHandler(userRepo *repository.AdminUserRepo, auditLog *repository.AuditLogRepo, jwt *auth.JWTProvider, totpCipher *auth.TOTPCipher, attempts totpAttemptLimiter, loginAttempts loginAttemptLimiter) *AuthHandler {
	return &AuthHandler{
		userRepo:      userRepo,
		auditLog:      auditLog,
		jwt:           jwt,
		totp:          totpCipher,
		attempts:      attempts,
		loginAttempts: loginAttempts,
		now:           time.Now,
	}
}

// ───────────────────────── galat khusus auth ─────────────────────────

func errSessionRevoked() *apperr.AppError {
	return middleware.ErrSessionRevoked()
}

// errMFAChallenge: tantangan tidak sah/kedaluwarsa → frontend kembali ke form login.
func errMFAChallenge() *apperr.AppError {
	return &apperr.AppError{
		Code:       "MFA_CHALLENGE_INVALID",
		Message:    "Tantangan MFA tidak valid atau kedaluwarsa. Silakan login ulang.",
		HTTPStatus: http.StatusUnauthorized,
	}
}

// errTOTPInvalid: kode salah atau sudah dipakai → frontend tetap di form kode.
// status 401 di /totp/verify (belum login), 400 di enable/disable (sesi tetap sah).
func errTOTPInvalid(status int) *apperr.AppError {
	return &apperr.AppError{
		Code:       "TOTP_INVALID",
		Message:    "Kode TOTP salah atau sudah dipakai. Tunggu kode berikutnya lalu coba lagi.",
		HTTPStatus: status,
	}
}

// errPasswordInvalid: sandi konfirmasi salah. 400, bukan 401: sesinya tetap sah
// dan frontend tidak boleh mengira harus login ulang.
func errPasswordInvalid() *apperr.AppError {
	return &apperr.AppError{
		Code:       "PASSWORD_INVALID",
		Message:    "Sandi salah.",
		HTTPStatus: http.StatusBadRequest,
	}
}

func errTOTPUnavailable() *apperr.AppError {
	return apperr.NewServiceUnavailable("Verifikasi TOTP sedang tidak tersedia. Coba lagi sebentar lagi.")
}

// errTOTPLocked: jatah percobaan jangka panjang admin ini habis. 423, bukan 429:
// menunggu beberapa menit tidak membukanya, dan console menampilkan pesannya
// apa adanya.
func errTOTPLocked() *apperr.AppError {
	return &apperr.AppError{
		Code: "TOTP_LOCKED",
		Message: fmt.Sprintf("Terlalu banyak kode TOTP atau sandi konfirmasi yang salah untuk akun ini (%d dalam %d hari); percobaan dikunci. "+
			"Minta super admin membukanya dengan mereset TOTP atau mengganti sandi akun ini.", totpMaxFailuresLong, int(totpFailureWindowLong.Hours()/24)),
		HTTPStatus: http.StatusLocked,
	}
}

// errMFASessionExpired: sesi ber-MFA sudah melewati auth.MFAMaxAge (atau
// refresh token ber-MFA tanpa mfa_at). Refresh ditolak; admin login ulang.
func errMFASessionExpired() *apperr.AppError {
	return &apperr.AppError{
		Code:       "MFA_SESSION_EXPIRED",
		Message:    fmt.Sprintf("Sesi TOTP berlaku paling lama %d jam. Silakan login ulang.", int(auth.MFAMaxAge.Hours())),
		HTTPStatus: http.StatusUnauthorized,
	}
}

// ───────────────────────── cookie ─────────────────────────

func setAuthCookies(c fiber.Ctx, tokens *auth.TokenPair) {
	c.Cookie(&fiber.Cookie{
		Name:     "auth_admin_token",
		Value:    tokens.AccessToken,
		Expires:  tokens.ExpiresAt,
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_admin_token",
		Value:    tokens.RefreshToken,
		Expires:  tokens.RefreshExpiresAt,
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})
}

func clearAuthCookies(c fiber.Ctx) {
	for _, name := range []string{"auth_admin_token", "refresh_admin_token"} {
		c.Cookie(&fiber.Cookie{
			Name:     name,
			Value:    "",
			Expires:  time.Now().Add(-1 * time.Hour),
			HTTPOnly: true,
			Secure:   true,
			SameSite: "Lax",
			Path:     "/",
		})
	}
}

// ───────────────────────── login ─────────────────────────

func (h *AuthHandler) Login(c fiber.Ctx) error {
	var req model.LoginRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	// Email tanpa peka huruf dan spasi tepi, sama dengan penyimpanannya.
	req.Email = model.NormalizeEmail(req.Email)
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	// Jatah per akun dipesan sebelum email dicari dan sandi dievaluasi, sama
	// untuk email terdaftar atau tidak. Dikembalikan hanya bila sandi benar.
	// Asal yang pernah login benar untuk email ini tidak memesan jatah.
	attemptKey := auth.LoginAttemptKey(req.Email)
	originKey := ""
	if ipKey := middleware.ClientIPKey(c); ipKey != "" {
		originKey = auth.LoginOriginKey(req.Email, ipKey)
	}
	reserved, appErr := h.reserveLoginAttempt(c, attemptKey, originKey, req.Email)
	if appErr != nil {
		return errResponse(c, appErr)
	}

	user, err := h.userRepo.FindByEmail(c.Context(), req.Email)
	if err != nil {
		slog.Error("login: gagal cari user", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if user == nil || !user.IsActive {
		return errResponse(c, apperr.NewUnauthorized("Email atau password salah"))
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return errResponse(c, apperr.NewUnauthorized("Email atau password salah"))
	}
	if reserved {
		h.resetLoginAttempts(c, attemptKey)
	}
	h.rememberLoginOrigin(c, originKey)

	// Admin ber-TOTP: kata sandi saja tidak menghasilkan token. Tidak ada cookie,
	// tidak ada last_login — keduanya baru terjadi di /totp/verify. Penerbitan
	// tantangan diaudit: "sandi benar" tanpa "login" sesudahnya, apalagi diikuti
	// totp_failed, tanda sandi admin ini dipegang orang lain.
	if user.TOTPEnabled() {
		challenge, _, err := h.jwt.GenerateMFAChallenge(user.ID, user.Email, user.TokenVersion)
		if err != nil {
			slog.Error("login: gagal membuat tantangan MFA", "error", err)
			return errResponse(c, apperr.NewInternal(err))
		}
		h.audit(c, user, "login_mfa_challenge", "Sandi benar; menunggu kode TOTP")
		c.Set(fiber.HeaderCacheControl, "no-store")
		return ok(c, model.LoginMFAResponse{MFARequired: true, Challenge: challenge})
	}

	return h.completeLogin(c, user, false, "Admin login")
}

// reserveLoginAttempt memesan satu jatah percobaan sandi untuk email ini.
// Jatah habis = 429 + Retry-After, sandi tidak dievaluasi. reserved=true bila
// satu jatah terpesan (dikembalikan saat sandi benar).
//
// Asal yang dikenal (origin: pernah memasukkan sandi benar untuk email ini
// dalam loginOriginTTL) tidak memesan jatah dan tidak pernah ditahan batas per
// akun: tanpa ini, siapa pun yang tahu email admin bisa mengunci loginnya
// selama ia mau (10 permintaan per 15 menit dari 2 IP).
//
// Redis tidak terjangkau = gagal TERBUKA ke batas per IP (dicatat di log), beda
// dengan faktor kedua yang gagal tertutup. Alasannya: pelaku tidak bisa membuat
// Redis gagal, dan gagal tertutup di sini menjadikan Redis titik mati seluruh
// login console (termasuk admin tanpa TOTP yang mengelola lisensi CAD).
func (h *AuthHandler) reserveLoginAttempt(c fiber.Ctx, key, origin, email string) (reserved bool, appErr *apperr.AppError) {
	if h.loginAttempts == nil {
		return false, nil
	}
	if origin != "" {
		known, err := h.loginAttempts.KnownOrigin(c.Context(), origin)
		if err != nil {
			slog.Warn("login: gagal memeriksa asal yang dikenal", "error", err)
		} else if known {
			return false, nil
		}
	}
	allowed, n, retry, err := h.loginAttempts.TakeKey(c.Context(), key)
	if err != nil {
		slog.Error("login: pembatas per akun tidak terjangkau; hanya batas per IP yang berlaku", "error", err)
		return false, nil
	}
	if allowed {
		return true, nil
	}
	secs := int(retry.Seconds())
	if secs < 1 {
		secs = 1
	}
	slog.Warn("login: batas percobaan per akun tercapai",
		"email", email, "ip", middleware.ClientIP(c), "percobaan_ke", n, "batas", loginMaxFailures)
	c.Set(fiber.HeaderRetryAfter, strconv.Itoa(secs))
	return false, apperr.NewTooManyRequests("Terlalu banyak percobaan login untuk email ini. Coba lagi dalam " +
		strconv.Itoa((secs+59)/60) + " menit.")
}

func (h *AuthHandler) resetLoginAttempts(c fiber.Ctx, key string) {
	if h.loginAttempts == nil {
		return
	}
	if err := h.loginAttempts.ResetKey(c.Context(), key); err != nil {
		slog.Warn("login: gagal mereset hitungan percobaan", "error", err)
	}
}

// rememberLoginOrigin: sandi benar dari asal ini; asal ini tidak dikenai batas
// per akun selama loginOriginTTL.
func (h *AuthHandler) rememberLoginOrigin(c fiber.Ctx, origin string) {
	if h.loginAttempts == nil || origin == "" {
		return
	}
	if err := h.loginAttempts.RememberOrigin(c.Context(), origin); err != nil {
		slog.Warn("login: gagal mencatat asal yang dikenal", "error", err)
	}
}

// completeLogin menerbitkan token, mencatat login, memasang cookie, dan
// menjawab dengan bentuk LoginResponse yang sama dengan sebelum Fase 0c.
func (h *AuthHandler) completeLogin(c fiber.Ctx, user *model.AdminUser, mfa bool, desc string) error {
	tokens, err := h.jwt.GenerateTokenPair(user.ID, user.Email, user.Role, user.FullName, mfa, user.TokenVersion)
	if err != nil {
		slog.Error("login: gagal generate token", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	_ = h.userRepo.UpdateLastLogin(c.Context(), user.ID)

	h.auditLog.LogAction(c.Context(), &user.ID, &user.FullName, "login", "admin_users", nil, &desc, middleware.ClientIP(c))

	setAuthCookies(c, tokens)

	return ok(c, model.LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt,
		User:         user.ToResponse(),
	})
}

// sessionUser memuat admin pemilik access token dan memastikan sesinya masih
// berlaku (aktif, token_version sama). Dipakai endpoint yang mengubah keadaan
// keamanan akun, supaya token yang sudah dicabut tidak bisa, misalnya,
// mematikan TOTP dalam sisa masa berlakunya.
func (h *AuthHandler) sessionUser(c fiber.Ctx) (*auth.Claims, *model.AdminUser, *apperr.AppError) {
	claims := middleware.GetClaims(c)
	user, appErr := middleware.CheckLiveSession(c.Context(), h.userRepo, claims)
	if appErr != nil {
		return nil, nil, appErr
	}
	return claims, user, nil
}

func (h *AuthHandler) audit(c fiber.Ctx, user *model.AdminUser, action, desc string) {
	resID := user.ID.String()
	h.auditLog.LogAction(c.Context(), &user.ID, &user.FullName, action, "admin_users", &resID, &desc, middleware.ClientIP(c))
}

func (h *AuthHandler) Me(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return errResponse(c, apperr.NewUnauthorized("Autentikasi diperlukan"))
	}

	user, err := h.userRepo.FindByID(c.Context(), claims.UserID)
	if err != nil || user == nil {
		return errResponse(c, apperr.NewUnauthorized("User tidak ditemukan"))
	}
	if !user.IsActive || user.TokenVersion != claims.TV {
		return errResponse(c, errSessionRevoked())
	}

	// mfa hanya true untuk sesi yang lolos TOTP kurang dari auth.MFAMaxAge lalu
	// (token ber-mfa tanpa mfa_at dianggap tidak segar).
	resp := model.MeResponse{
		AdminUserResponse: user.ToResponse(),
		MFA:               claims.HasFreshMFA(h.wallNow()),
		TOTPEnabled:       user.TOTPEnabled(),
	}
	if resp.MFA {
		at := claims.MFATime()
		resp.MFAAt = &at
	}
	if resp.TOTPEnabled {
		resp.TOTPEnabledAt = user.TOTPEnabledAt
	}
	return ok(c, resp)
}

func (h *AuthHandler) Refresh(c fiber.Ctx) error {
	tokenStr := c.Cookies("refresh_admin_token")
	if tokenStr == "" {
		// Try from body
		var body struct {
			RefreshToken string `json:"refresh_token"`
		}
		_ = c.Bind().JSON(&body)
		tokenStr = body.RefreshToken
	}

	if tokenStr == "" {
		return errResponse(c, apperr.NewUnauthorized("Refresh token diperlukan"))
	}

	claims, err := h.jwt.ValidateRefresh(tokenStr)
	if err != nil {
		return errResponse(c, apperr.NewUnauthorized("Refresh token tidak valid"))
	}

	user, err := h.userRepo.FindByID(c.Context(), claims.UserID)
	if err != nil || user == nil || !user.IsActive {
		return errResponse(c, apperr.NewUnauthorized("User tidak ditemukan atau tidak aktif"))
	}
	if user.TokenVersion != claims.TV {
		return errResponse(c, errSessionRevoked())
	}

	// MFA diwarisi dari refresh token beserta mfa_at-nya: sesi yang lolos TOTP
	// tetap ber-MFA sampai mfa_at + auth.MFAMaxAge (token baru dipotong di batas
	// itu), lalu refresh ditolak dan admin login ulang memakai TOTP. Sesi tanpa
	// TOTP tidak pernah naik kelas lewat refresh. Refresh token ber-mfa tanpa
	// mfa_at (terbit sebelum klaim itu ada) ditolak.
	if claims.MFA && !claims.HasFreshMFA(h.wallNow()) {
		return errResponse(c, errMFASessionExpired())
	}
	tokens, err := h.jwt.GenerateTokenPairMFA(user.ID, user.Email, user.Role, user.FullName, claims.MFATime(), user.TokenVersion)
	if errors.Is(err, auth.ErrMFAExpired) {
		return errResponse(c, errMFASessionExpired())
	}
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}

	c.Cookie(&fiber.Cookie{
		Name:     "auth_admin_token",
		Value:    tokens.AccessToken,
		Expires:  tokens.ExpiresAt,
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})

	return ok(c, model.LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresAt:    tokens.ExpiresAt,
		User:         user.ToResponse(),
	})
}

func (h *AuthHandler) Permissions(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return errResponse(c, apperr.NewUnauthorized("Autentikasi diperlukan"))
	}

	perms := rbac.PermissionsForRole(claims.Role)
	return ok(c, fiber.Map{
		"role":        claims.Role,
		"permissions": perms,
	})
}

func (h *AuthHandler) Logout(c fiber.Ctx) error {
	clearAuthCookies(c)
	return c.Status(fiber.StatusNoContent).Send(nil)
}

// LogoutAll mencabut semua sesi admin ini di semua perangkat (token_version+1).
func (h *AuthHandler) LogoutAll(c fiber.Ctx) error {
	_, user, appErr := h.sessionUser(c)
	if appErr != nil {
		return errResponse(c, appErr)
	}
	if _, err := h.userRepo.BumpTokenVersion(c.Context(), user.ID); err != nil {
		slog.Error("logout-all: gagal menaikkan token_version", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	h.audit(c, user, "logout_all", "Admin mencabut semua sesinya sendiri")
	clearAuthCookies(c)
	return c.Status(fiber.StatusNoContent).Send(nil)
}

// ───────────────────────── TOTP ─────────────────────────

func (h *AuthHandler) reserveAttempt(c fiber.Ctx, userID uuid.UUID) (auth.AttemptResult, *apperr.AppError) {
	return takeAttempt(c, h.attempts, userID)
}

func (h *AuthHandler) logRejected(c fiber.Ctx, user *model.AdminUser, stage string, res auth.AttemptResult) {
	auditRejectedAttempt(c, h.auditLog, user, stage, res)
}

func (h *AuthHandler) resetFailures(c fiber.Ctx, userID uuid.UUID) {
	releaseAttempt(c, h.attempts, userID)
}

func (h *AuthHandler) refund(c fiber.Ctx, user *model.AdminUser, stage, cause string, err error) {
	refundAttempt(c, h.attempts, h.auditLog, user, stage, cause, err)
}

// TOTPVerify menukar tantangan MFA + kode TOTP dengan pasangan token ber-MFA.
func (h *AuthHandler) TOTPVerify(c fiber.Ctx) error {
	if h.totp == nil {
		return errResponse(c, errTOTPUnavailable())
	}
	var req model.TOTPVerifyRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	claims, err := h.jwt.ValidateMFAChallenge(req.Challenge)
	if err != nil {
		return errResponse(c, errMFAChallenge())
	}
	code, valid := auth.NormalizeTOTPCode(req.Code)
	if !valid {
		return errResponse(c, apperr.NewBadRequest("Kode TOTP harus 6 digit angka"))
	}

	user, err := h.userRepo.FindByID(c.Context(), claims.UserID)
	if err != nil {
		slog.Error("totp verify: gagal memuat admin", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if user == nil || !user.IsActive || user.TokenVersion != claims.TV || !user.TOTPEnabled() {
		return errResponse(c, errMFAChallenge())
	}
	// Mulai dari sini setiap permintaan memakai satu jatah, apa pun hasilnya.
	res, appErr := h.reserveAttempt(c, user.ID)
	if appErr != nil {
		return errResponse(c, appErr)
	}

	// Galat server sesudah pemesanan mengembalikan jatahnya (refundAttempt):
	// setelah rotasi JWT_SECRET setiap verifikasi menjawab 500, dan tanpa ini
	// setiap percobaan memakan jatah 30 hari tanpa jejak di audit.
	secret, err := h.totp.Open(user.ID, *user.TOTPSecretEnc)
	if err != nil {
		h.refund(c, user, "login", causeSecretUnreadable, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	step, matched, err := auth.VerifyTOTP(secret, code, h.now(), user.TOTPLastStep)
	if err != nil {
		h.refund(c, user, "login", causeSecretCorrupt, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !matched {
		h.logRejected(c, user, "login", res)
		return errResponse(c, errTOTPInvalid(http.StatusUnauthorized))
	}
	consumed, err := h.userRepo.ConsumeTOTPStep(c.Context(), user.ID, step)
	if err != nil {
		h.refund(c, user, "login", causeDBWrite, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !consumed {
		// Permintaan lain dengan kode yang sama menang lebih dulu.
		h.logRejected(c, user, "login", res)
		return errResponse(c, errTOTPInvalid(http.StatusUnauthorized))
	}
	h.resetFailures(c, user.ID)

	return h.completeLogin(c, user, true, "Admin login (TOTP)")
}

// TOTPSetup membuat rahasia tertunda untuk admin yang sedang login. Belum
// mengaktifkan apa pun: TOTP baru wajib setelah /totp/enable dengan kode sah.
//
// Wajib sandi saat ini: access token atau cookie curian saja tidak cukup untuk
// memasang authenticator milik pencuri (yang akan mengunci pemilik akun).
// Sandi yang salah memakai jatah percobaan yang sama dengan kode TOTP, jadi
// endpoint ini tidak bisa dipakai menebak sandi tanpa batas.
func (h *AuthHandler) TOTPSetup(c fiber.Ctx) error {
	if h.totp == nil {
		return errResponse(c, errTOTPUnavailable())
	}
	_, user, appErr := h.sessionUser(c)
	if appErr != nil {
		return errResponse(c, appErr)
	}
	var req model.TOTPSetupRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}
	if user.TOTPEnabled() {
		return errResponse(c, apperr.NewConflict("TOTP sudah aktif. Nonaktifkan dulu untuk mendaftarkan perangkat baru."))
	}
	res, appErr := h.reserveAttempt(c, user.ID)
	if appErr != nil {
		return errResponse(c, appErr)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		if !errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			// Hash tersimpan rusak: galat server, bukan sandi salah.
			h.refund(c, user, "setup_sandi", causePasswordHashCorrupt, err)
			return errResponse(c, apperr.NewInternal(err))
		}
		h.logRejected(c, user, "setup_sandi", res)
		return errResponse(c, errPasswordInvalid())
	}
	h.resetFailures(c, user.ID)

	secret, url, err := auth.NewTOTPKey(user.Email)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	enc, err := h.totp.Seal(user.ID, secret)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	saved, err := h.userRepo.SetTOTPPending(c.Context(), user.ID, enc)
	if err != nil {
		slog.Error("totp setup: gagal menyimpan rahasia tertunda", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !saved {
		return errResponse(c, apperr.NewConflict("TOTP sudah aktif. Nonaktifkan dulu untuk mendaftarkan perangkat baru."))
	}

	h.audit(c, user, "totp_setup", "Admin memulai pendaftaran TOTP")
	c.Set(fiber.HeaderCacheControl, "no-store")
	return ok(c, model.TOTPSetupResponse{
		OtpauthURL: url,
		Secret:     secret,
		Issuer:     auth.TOTPIssuer,
		Account:    user.Email,
	})
}

// TOTPEnable mengonfirmasi rahasia tertunda dengan satu kode sah, lalu
// mengaktifkannya dan mencabut semua sesi (admin login ulang memakai TOTP).
func (h *AuthHandler) TOTPEnable(c fiber.Ctx) error {
	if h.totp == nil {
		return errResponse(c, errTOTPUnavailable())
	}
	_, user, appErr := h.sessionUser(c)
	if appErr != nil {
		return errResponse(c, appErr)
	}
	var req model.TOTPCodeRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	code, valid := auth.NormalizeTOTPCode(req.Code)
	if !valid {
		return errResponse(c, apperr.NewBadRequest("Kode TOTP harus 6 digit angka"))
	}
	if user.TOTPEnabled() {
		return errResponse(c, apperr.NewConflict("TOTP sudah aktif"))
	}
	if user.TOTPPendingEnc == nil {
		return errResponse(c, apperr.NewBadRequest("Belum ada pendaftaran TOTP. Jalankan setup dulu."))
	}
	res, appErr := h.reserveAttempt(c, user.ID)
	if appErr != nil {
		return errResponse(c, appErr)
	}

	secret, err := h.totp.Open(user.ID, *user.TOTPPendingEnc)
	if err != nil {
		h.refund(c, user, "enable", causeSecretUnreadable, err)
		return errResponse(c, apperr.NewBadRequest("Pendaftaran TOTP tidak berlaku lagi. Jalankan setup ulang."))
	}
	step, matched, err := auth.VerifyTOTP(secret, code, h.now(), nil)
	if err != nil {
		h.refund(c, user, "enable", causeSecretCorrupt, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !matched {
		h.logRejected(c, user, "enable", res)
		return errResponse(c, errTOTPInvalid(http.StatusBadRequest))
	}
	enabled, err := h.userRepo.EnableTOTP(c.Context(), user.ID, *user.TOTPPendingEnc, step)
	if err != nil {
		h.refund(c, user, "enable", causeDBWrite, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !enabled {
		return errResponse(c, apperr.NewConflict("Pendaftaran TOTP berubah di tempat lain. Jalankan setup ulang."))
	}
	h.resetFailures(c, user.ID)

	h.audit(c, user, "totp_enable", "Admin mengaktifkan TOTP; semua sesinya dicabut")
	clearAuthCookies(c)
	return ok(c, fiber.Map{"totp_enabled": true, "relogin_required": true})
}

// TOTPDisable mematikan TOTP. Butuh sesi yang lolos TOTP dan satu kode sah
// saat ini; semua sesi dicabut sesudahnya.
func (h *AuthHandler) TOTPDisable(c fiber.Ctx) error {
	if h.totp == nil {
		return errResponse(c, errTOTPUnavailable())
	}
	claims, user, appErr := h.sessionUser(c)
	if appErr != nil {
		return errResponse(c, appErr)
	}
	var req model.TOTPCodeRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	code, valid := auth.NormalizeTOTPCode(req.Code)
	if !valid {
		return errResponse(c, apperr.NewBadRequest("Kode TOTP harus 6 digit angka"))
	}
	if !user.TOTPEnabled() {
		return errResponse(c, apperr.NewConflict("TOTP belum aktif"))
	}
	if !claims.HasFreshMFA(h.wallNow()) {
		return errResponse(c, apperr.NewForbidden("Sesi ini belum lolos TOTP. Login ulang memakai TOTP untuk mematikannya."))
	}
	res, appErr := h.reserveAttempt(c, user.ID)
	if appErr != nil {
		return errResponse(c, appErr)
	}

	secret, err := h.totp.Open(user.ID, *user.TOTPSecretEnc)
	if err != nil {
		h.refund(c, user, "disable", causeSecretUnreadable, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	step, matched, err := auth.VerifyTOTP(secret, code, h.now(), user.TOTPLastStep)
	if err != nil {
		h.refund(c, user, "disable", causeSecretCorrupt, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !matched {
		h.logRejected(c, user, "disable", res)
		return errResponse(c, errTOTPInvalid(http.StatusBadRequest))
	}
	disabled, err := h.userRepo.DisableTOTP(c.Context(), user.ID, step)
	if err != nil {
		h.refund(c, user, "disable", causeDBWrite, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !disabled {
		h.logRejected(c, user, "disable", res)
		return errResponse(c, errTOTPInvalid(http.StatusBadRequest))
	}
	h.resetFailures(c, user.ID)

	h.audit(c, user, "totp_disable", "Admin menonaktifkan TOTP; semua sesinya dicabut")
	clearAuthCookies(c)
	return ok(c, fiber.Map{"totp_enabled": false, "relogin_required": true})
}
