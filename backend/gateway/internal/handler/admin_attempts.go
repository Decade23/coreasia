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
