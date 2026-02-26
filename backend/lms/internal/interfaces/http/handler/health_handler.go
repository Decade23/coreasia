package handler

import (
	"github.com/coreasia/lms-api/internal/infrastructure/persistence/postgres"
	"github.com/gofiber/fiber/v3"
)

type HealthHandler struct {
	db *postgres.TenantDB
}

func NewHealthHandler(db *postgres.TenantDB) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) Liveness(c fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "ok",
	})
}

func (h *HealthHandler) Readiness(c fiber.Ctx) error {
	if err := h.db.Pool.Ping(c.Context()); err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"status": "unhealthy",
			"error":  "database connection failed",
		})
	}

	return c.JSON(fiber.Map{
		"status": "ok",
		"checks": fiber.Map{
			"database": "connected",
		},
	})
}

func (h *HealthHandler) RegisterRoutes(app *fiber.App) {
	app.Get("/healthz", h.Liveness)
	app.Get("/readyz", h.Readiness)
}
