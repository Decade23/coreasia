package middleware

import (
	"context"
	"log/slog"
	"strings"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

const ClaimsKey = "claims"

// LiveUserKey: admin pemilik sesi, dimuat RequireLiveSession dari DB.
const LiveUserKey = "live_admin"

func AuthMiddleware(jwt *auth.JWTProvider) fiber.Handler {
	return func(c fiber.Ctx) error {
		tokenStr := extractToken(c)
		if tokenStr == "" {
			appErr := apperr.NewUnauthorized("Autentikasi diperlukan")
			return c.Status(appErr.HTTPStatus).JSON(fiber.Map{
				"data":   nil,
				"errors": fiber.Map{"code": appErr.Code, "message": appErr.Message},
			})
		}

		// Hanya access token (typ=access). Refresh token, tantangan MFA, dan token
		// lama tanpa typ ditolak di sini. Sengaja tanpa kueri DB: pencabutan
		// lewat token_version ditegakkan di /auth/me, /auth/refresh, endpoint
		// TOTP, dan rute bernilai tinggi yang memakai RequireLiveSession. Di rute
		// lain, access token yang sudah dicabut paling lama hidup selama
		// JWT_ACCESS_TTL.
		claims, err := jwt.ValidateAccess(tokenStr)
		if err != nil {
			appErr := apperr.NewUnauthorized("Token tidak valid atau sudah kedaluwarsa")
			return c.Status(appErr.HTTPStatus).JSON(fiber.Map{
				"data":   nil,
				"errors": fiber.Map{"code": appErr.Code, "message": appErr.Message},
			})
		}

		c.Locals(ClaimsKey, claims)
		return c.Next()
	}
}

// AdminUserFinder adalah bagian repositori admin_users yang dibutuhkan
// pemeriksaan sesi hidup.
type AdminUserFinder interface {
	FindByID(ctx context.Context, id uuid.UUID) (*model.AdminUser, error)
}

// ErrSessionRevoked: token sah secara kriptografis, tetapi sesinya sudah dicabut
// (token_version naik), akunnya nonaktif, atau akunnya sudah tidak ada.
func ErrSessionRevoked() *apperr.AppError {
	return apperr.NewUnauthorized("Sesi sudah tidak berlaku. Silakan login ulang.")
}

// CheckLiveSession memuat admin pemilik klaim dan memastikan sesinya masih
// hidup: akun ada, aktif, dan token_version-nya sama dengan klaim tv.
func CheckLiveSession(ctx context.Context, users AdminUserFinder, claims *auth.Claims) (*model.AdminUser, *apperr.AppError) {
	if claims == nil {
		return nil, apperr.NewUnauthorized("Autentikasi diperlukan")
	}
	user, err := users.FindByID(ctx, claims.UserID)
	if err != nil {
		slog.Error("auth: gagal memuat admin untuk cek sesi", "admin_id", claims.UserID, "error", err)
		return nil, apperr.NewInternal(err)
	}
	if user == nil || !user.IsActive || user.TokenVersion != claims.TV {
		return nil, ErrSessionRevoked()
	}
	return user, nil
}

// RequireLiveSession menegakkan pencabutan sesi (token_version, is_active) di
// rute bernilai tinggi yang jarang dipanggil: manajemen admin dan API key.
// Tanpa ini, access token super admin yang sudah dicabut masih bisa membuat
// admin atau API key baru (akses yang bertahan) selama sisa umurnya.
//
// Biayanya satu kueri per permintaan, hanya di rute yang memakainya. Peran di
// klaim diganti peran dari DB, jadi RequirePermission sesudahnya memakai peran
// terkini. Harus dipasang SETELAH AuthMiddleware dan SEBELUM RequirePermission.
func RequireLiveSession(users AdminUserFinder) fiber.Handler {
	return func(c fiber.Ctx) error {
		user, appErr := CheckLiveSession(c.Context(), users, GetClaims(c))
		if appErr != nil {
			return c.Status(appErr.HTTPStatus).JSON(fiber.Map{
				"data":   nil,
				"errors": fiber.Map{"code": appErr.Code, "message": appErr.Message},
			})
		}
		live := *GetClaims(c)
		live.Role, live.Email, live.FullName = user.Role, user.Email, user.FullName
		c.Locals(ClaimsKey, &live)
		c.Locals(LiveUserKey, user)
		return c.Next()
	}
}

// GetLiveUser memulangkan admin pemilik sesi yang dimuat RequireLiveSession,
// atau nil di rute tanpa RequireLiveSession.
func GetLiveUser(c fiber.Ctx) *model.AdminUser {
	u, ok := c.Locals(LiveUserKey).(*model.AdminUser)
	if !ok {
		return nil
	}
	return u
}

func GetClaims(c fiber.Ctx) *auth.Claims {
	claims, ok := c.Locals(ClaimsKey).(*auth.Claims)
	if !ok {
		return nil
	}
	return claims
}

func extractToken(c fiber.Ctx) string {
	// Check Authorization header first
	header := c.Get("Authorization")
	if header != "" {
		parts := strings.SplitN(header, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			return parts[1]
		}
	}

	// Fallback to cookie
	return c.Cookies("auth_admin_token")
}
