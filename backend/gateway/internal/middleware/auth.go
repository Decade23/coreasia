package middleware

import (
	"strings"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
)

const ClaimsKey = "claims"

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

		claims, err := jwt.ValidateToken(tokenStr)
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
