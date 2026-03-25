package handler

import (
	"log/slog"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/rbac"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	userRepo *repository.AdminUserRepo
	auditLog *repository.AuditLogRepo
	jwt      *auth.JWTProvider
}

func NewAuthHandler(userRepo *repository.AdminUserRepo, auditLog *repository.AuditLogRepo, jwt *auth.JWTProvider) *AuthHandler {
	return &AuthHandler{userRepo: userRepo, auditLog: auditLog, jwt: jwt}
}

func (h *AuthHandler) Login(c fiber.Ctx) error {
	var req model.LoginRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
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

	tokens, err := h.jwt.GenerateTokenPair(user.ID, user.Email, user.Role, user.FullName)
	if err != nil {
		slog.Error("login: gagal generate token", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	_ = h.userRepo.UpdateLastLogin(c.Context(), user.ID)

	ip := c.IP()
	desc := "Admin login"
	h.auditLog.LogAction(c.Context(), &user.ID, &user.FullName, "login", "admin_users", nil, &desc, ip)

	// Set cookies
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
		Expires:  time.Now().Add(720 * time.Hour),
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

func (h *AuthHandler) Me(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return errResponse(c, apperr.NewUnauthorized("Autentikasi diperlukan"))
	}

	user, err := h.userRepo.FindByID(c.Context(), claims.UserID)
	if err != nil || user == nil {
		return errResponse(c, apperr.NewUnauthorized("User tidak ditemukan"))
	}

	return ok(c, user.ToResponse())
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

	claims, err := h.jwt.ValidateToken(tokenStr)
	if err != nil {
		return errResponse(c, apperr.NewUnauthorized("Refresh token tidak valid"))
	}

	user, err := h.userRepo.FindByID(c.Context(), claims.UserID)
	if err != nil || user == nil || !user.IsActive {
		return errResponse(c, apperr.NewUnauthorized("User tidak ditemukan atau tidak aktif"))
	}

	tokens, err := h.jwt.GenerateTokenPair(user.ID, user.Email, user.Role, user.FullName)
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
	c.Cookie(&fiber.Cookie{
		Name:     "auth_admin_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_admin_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
		Path:     "/",
	})

	return c.Status(fiber.StatusNoContent).Send(nil)
}
