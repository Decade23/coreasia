package middleware

import (
	"github.com/coreasia/gateway/internal/rbac"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
)

// RequirePermission returns middleware that checks if the authenticated user
// has the specified permission. Must be chained AFTER AuthMiddleware.
func RequirePermission(perm rbac.Permission) fiber.Handler {
	return func(c fiber.Ctx) error {
		claims := GetClaims(c)
		if claims == nil {
			appErr := apperr.NewUnauthorized("Autentikasi diperlukan")
			return c.Status(appErr.HTTPStatus).JSON(fiber.Map{
				"data":   nil,
				"errors": fiber.Map{"code": appErr.Code, "message": appErr.Message},
			})
		}

		if !rbac.HasPermission(claims.Role, perm) {
			appErr := apperr.NewForbidden("Anda tidak memiliki akses untuk operasi ini")
			return c.Status(appErr.HTTPStatus).JSON(fiber.Map{
				"data":   nil,
				"errors": fiber.Map{"code": appErr.Code, "message": appErr.Message},
			})
		}

		return c.Next()
	}
}
