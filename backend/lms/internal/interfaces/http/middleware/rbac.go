package middleware

import (
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/gofiber/fiber/v3"
)

func RequireRoles(roles ...string) fiber.Handler {
	roleSet := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		roleSet[r] = struct{}{}
	}

	return func(c fiber.Ctx) error {
		claims := GetClaims(c)
		if claims == nil {
			return response.Error(c, apperr.NewUnauthorized("Autentikasi diperlukan"))
		}

		if _, ok := roleSet[claims.Role]; !ok {
			return response.Error(c, apperr.NewForbidden("Anda tidak memiliki akses ke resource ini"))
		}

		return c.Next()
	}
}
