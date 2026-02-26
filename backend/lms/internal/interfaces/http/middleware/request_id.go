package middleware

import (
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

func RequestID() fiber.Handler {
	return func(c fiber.Ctx) error {
		reqID := c.Get("X-Request-Id")
		if reqID == "" {
			reqID = uuid.New().String()
		}
		c.Set("X-Request-Id", reqID)
		c.Locals("request_id", reqID)
		return c.Next()
	}
}
