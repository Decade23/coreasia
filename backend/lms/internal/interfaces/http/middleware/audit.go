package middleware

import (
	"fmt"
	"strings"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/domain/repository"
	"github.com/gofiber/fiber/v3"
)

func AuditMutations(auditRepo repository.AuditLogRepository) fiber.Handler {
	return func(c fiber.Ctx) error {
		method := c.Method()
		if !isMutationMethod(method) {
			return c.Next()
		}

		if err := c.Next(); err != nil {
			return err
		}

		if c.Response().StatusCode() >= fiber.StatusBadRequest {
			return nil
		}

		claims := GetClaims(c)
		if claims == nil {
			return nil
		}

		action := actionFromMethod(method, c.Path())
		resource := resourceFromPath(c.Path())
		resourceIDValue := c.Params("id")
		var resourceID *string
		if resourceIDValue != "" {
			resourceID = &resourceIDValue
		}

		userID := claims.UserID
		userName := claims.FullName
		userRole := claims.Role
		ip := c.IP()
		description := fmt.Sprintf("%s %s", action, c.Path())

		return auditRepo.Create(c.Context(), &entity.AuditLog{
			UserID:      &userID,
			UserName:    &userName,
			UserRole:    &userRole,
			Action:      action,
			Resource:    resource,
			ResourceID:  resourceID,
			Description: &description,
			IPAddress:   &ip,
		})
	}
}

func isMutationMethod(method string) bool {
	switch method {
	case fiber.MethodPost, fiber.MethodPut, fiber.MethodPatch, fiber.MethodDelete:
		return true
	default:
		return false
	}
}

func actionFromMethod(method string, path string) string {
	if strings.Contains(path, "/submit") {
		return "submit"
	}
	switch method {
	case fiber.MethodPost:
		return "create"
	case fiber.MethodPut, fiber.MethodPatch:
		return "update"
	case fiber.MethodDelete:
		return "delete"
	default:
		return strings.ToLower(method)
	}
}

func resourceFromPath(path string) string {
	cleaned := strings.Trim(strings.TrimPrefix(path, "/api/"), "/")
	parts := strings.Split(cleaned, "/")
	if len(parts) == 0 || parts[0] == "" {
		return "api"
	}
	return parts[0]
}
