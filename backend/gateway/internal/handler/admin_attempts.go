package handler

import (
	"fmt"
	"log/slog"
	"strconv"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// Jatah percobaan faktor kedua per admin, dipakai AuthHandler (kode TOTP, sandi
// konfirmasi /totp/setup) dan AdminUserHandler (sandi saat ini untuk mengganti
// sandi sendiri). Satu jatah bersama, dua lapis (lihat auth.RedisTOTPLimiter).

// takeAttempt memesan satu jatah SEBELUM kode atau sandi dievaluasi.
//   - Gagal tertutup: pembatas tidak ada, Redis tidak terjangkau, atau menolak
//     tulis (READONLY, OOM) = 503 tanpa evaluasi, bukan dilewati tanpa batas.
//   - Jendela pendek habis = 429 + Retry-After.
//   - Jatah panjang habis = 423 TOTP_LOCKED (+ Retry-After sisa jendela panjang).
func takeAttempt(c fiber.Ctx, lim totpAttemptLimiter, userID uuid.UUID) (auth.AttemptResult, *apperr.AppError) {
	if lim == nil {
		return auth.AttemptResult{}, errTOTPUnavailable()
	}
	res, err := lim.Take(c.Context(), userID)
	if err != nil {
		slog.Error("totp: pembatas percobaan tidak terjangkau", "admin_id", userID, "error", err)
		return res, errTOTPUnavailable()
	}
	if res.Allowed {
		return res, nil
	}
	secs := int(res.Retry.Seconds())
	if secs < 1 {
		secs = 1
	}
	c.Set(fiber.HeaderRetryAfter, strconv.Itoa(secs))
	if res.Locked {
		slog.Warn("totp: percobaan ditolak, akun terkunci (jatah jangka panjang habis)",
			"admin_id", userID, "ip", middleware.ClientIP(c), "gagal_jendela_panjang", res.Long, "batas", totpMaxFailuresLong)
		return res, errTOTPLocked()
	}
	return res, apperr.NewTooManyRequests("Terlalu banyak percobaan salah. Coba lagi dalam " +
		strconv.Itoa((secs+59)/60) + " menit.")
}

// auditRejectedAttempt mencatat kode/sandi yang dievaluasi lalu ditolak, ke log
// DAN gateway_audit_logs (aksi totp_failed). Jumlah barisnya terbatas: hanya
// percobaan yang dievaluasi, paling banyak totpMaxFailuresLong per admin per
// jendela panjang. Saat jatah panjang habis karena penolakan ini, satu baris
// totp_locked ditambahkan. Kode atau sandi yang diketik TIDAK pernah dicatat.
//
// Baris ini sinyal terkuat bahwa sandi admin dipegang orang lain: di tahap
// "login", sandinya sudah benar dan hanya kodenya yang salah.
func auditRejectedAttempt(c fiber.Ctx, audit auditLogger, user *model.AdminUser, stage string, res auth.AttemptResult) {
	ip := middleware.ClientIP(c)
	days := int(totpFailureWindowLong.Hours() / 24)
	slog.Warn("totp: percobaan ditolak",
		"tahap", stage,
		"admin_id", user.ID,
		"email", user.Email,
		"ip", ip,
		"percobaan_ke", res.N,
		"batas", totpMaxFailures,
		"gagal_jendela_panjang", res.Long,
		"batas_jendela_panjang", totpMaxFailuresLong,
	)
	if audit == nil {
		return
	}
	resID := user.ID.String()
	desc := fmt.Sprintf("Percobaan faktor kedua ditolak (tahap %s), kegagalan ke-%d dari %d dalam %d hari", stage, res.Long, totpMaxFailuresLong, days)
	if stage == "login" {
		desc += "; sandi akun ini BENAR, hanya kode TOTP yang salah"
	}
	audit.LogAction(c.Context(), &user.ID, &user.FullName, "totp_failed", "admin_users", &resID, &desc, ip)
	if res.Long >= totpMaxFailuresLong {
		slog.Error("totp: jatah percobaan jangka panjang habis; faktor kedua akun ini dikunci",
			"admin_id", user.ID, "email", user.Email, "ip", ip)
		lock := fmt.Sprintf("Faktor kedua DIKUNCI: %d kegagalan dalam %d hari. Buka dengan reset TOTP atau ganti sandi oleh super admin", totpMaxFailuresLong, days)
		audit.LogAction(c.Context(), &user.ID, &user.FullName, "totp_locked", "admin_users", &resID, &lock, ip)
	}
}

// releaseAttempt: kode atau sandi yang benar diterima.
func releaseAttempt(c fiber.Ctx, lim totpAttemptLimiter, userID uuid.UUID) {
	if lim == nil {
		return
	}
	if err := lim.Reset(c.Context(), userID); err != nil {
		slog.Warn("totp: gagal mereset hitungan percobaan", "admin_id", userID, "error", err)
	}
}

// refundAttempt: percobaan yang sudah memesan jatah tidak bisa dievaluasi
// sampai tuntas karena galat server (rahasia TOTP tidak terbuka setelah rotasi
// JWT_SECRET, rahasia tersimpan rusak, DB gagal). Jatahnya dikembalikan, supaya
// galat server tidak memakan jatah 30 hari dan diam-diam mengunci akun, dan satu
// baris audit totp_error dicatat supaya 500 beruntun terlihat. Detail galat
// hanya ke log; klien tetap menerima 500 umum dari pemanggil.
func refundAttempt(c fiber.Ctx, lim totpAttemptLimiter, audit auditLogger, user *model.AdminUser, stage, cause string, err error) {
	ip := middleware.ClientIP(c)
	slog.Error("totp: galat server; jatah percobaan dikembalikan",
		"tahap", stage, "sebab", cause, "admin_id", user.ID, "ip", ip, "error", err)
	if lim != nil {
		if rerr := lim.Refund(c.Context(), user.ID); rerr != nil {
			slog.Warn("totp: gagal mengembalikan jatah percobaan", "admin_id", user.ID, "error", rerr)
		}
	}
	if audit == nil {
		return
	}
	resID := user.ID.String()
	desc := fmt.Sprintf("Faktor kedua tidak bisa diperiksa karena galat server (tahap %s: %s); jatah percobaan dikembalikan", stage, cause)
	audit.LogAction(c.Context(), &user.ID, &user.FullName, "totp_error", "admin_users", &resID, &desc, ip)
}

// Sebab galat server untuk refundAttempt (dicatat di audit, tanpa isi galat).
const (
	causeSecretUnreadable = "rahasia TOTP tidak bisa dibuka (JWT_SECRET dirotasi?)"
	causeSecretCorrupt    = "rahasia TOTP tersimpan rusak"
	causeDBWrite          = "gagal menulis ke database"
	// hash sandi tersimpan bukan hash bcrypt yang sah (mis. diubah lewat SQL)
	causePasswordHashCorrupt = "hash sandi tersimpan rusak"
)

// clearAttempts membuka kunci faktor kedua (kedua lapis). Dipanggil setelah
// super admin mereset TOTP atau mengganti sandi akun itu: penguncian terjadi
// karena seseorang memegang sandinya, dan kedua tindakan itu memutus pegangan
// tersebut. Gagal = dicatat saja; perubahan di DB sudah terjadi.
func clearAttempts(c fiber.Ctx, lim totpAttemptLimiter, userID uuid.UUID) {
	if lim == nil {
		return
	}
	if err := lim.Clear(c.Context(), userID); err != nil {
		slog.Warn("totp: gagal membuka kunci percobaan; hapus manual kunci Redis-nya (lihat README)", "admin_id", userID, "error", err)
	}
}
