package middleware

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
)

func RequestLogger() fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		duration := time.Since(start)
		status := c.Response().StatusCode()

		attrs := []any{
			"method", c.Method(),
			"path", c.Path(),
			"status", status,
			"duration_ms", duration.Milliseconds(),
			"ip", c.IP(),
		}

		if reqID, ok := c.Locals("request_id").(string); ok {
			attrs = append(attrs, "request_id", reqID)
		}

		if schema := GetTenantSchema(c); schema != "" {
			attrs = append(attrs, "tenant", schema)
		}

		if status >= 500 {
			slog.Error("request", attrs...)
		} else if status >= 400 {
			slog.Warn("request", attrs...)
		} else {
			slog.Info("request", attrs...)
		}

		return err
	}
}
