package middleware

import (
	"strings"

	"github.com/coreasia/lms-api/internal/infrastructure/auth"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/gofiber/fiber/v3"
)

type contextKey string

const ClaimsKey contextKey = "claims"

func AuthMiddleware(jwt *auth.JWTProvider) fiber.Handler {
	return func(c fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" {
			cookie := c.Cookies("auth_token")
			if cookie == "" {
				return response.Error(c, apperr.NewUnauthorized("Token tidak ditemukan"))
			}
			header = "Bearer " + cookie
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			return response.Error(c, apperr.NewUnauthorized("Format token tidak valid"))
		}

		claims, err := jwt.ValidateAccessToken(parts[1])
		if err != nil {
			return response.Error(c, apperr.NewUnauthorized("Token expired atau tidak valid"))
		}

		c.Locals(string(ClaimsKey), claims)
		return c.Next()
	}
}

func GetClaims(c fiber.Ctx) *auth.Claims {
	claims, ok := c.Locals(string(ClaimsKey)).(*auth.Claims)
	if !ok {
		return nil
	}
	return claims
}
