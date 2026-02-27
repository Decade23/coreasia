package handler

import (
	"log/slog"

	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
)

type PlansHandler struct {
	planRepo *repository.PlanRepo
}

func NewPlansHandler(planRepo *repository.PlanRepo) *PlansHandler {
	return &PlansHandler{planRepo: planRepo}
}

// ListPlans returns all active subscription plans.
// GET /api/plans
func (h *PlansHandler) ListPlans(c fiber.Ctx) error {
	plans, err := h.planRepo.ListActive(c.Context())
	if err != nil {
		slog.Error("failed to list plans", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	// Map to public DTOs (exclude is_active, created_at)
	result := make([]model.PlanResponse, 0, len(plans))
	for _, p := range plans {
		result = append(result, model.PlanResponse{
			ID:           p.ID,
			Name:         p.Name,
			MaxAssessees: p.MaxAssessees,
			MaxSchemes:   p.MaxSchemes,
			Features:     p.Features,
			PriceMonthly: p.PriceMonthly,
		})
	}

	return ok(c, result)
}

func (h *PlansHandler) RegisterRoutes(api fiber.Router) {
	api.Get("/plans", h.ListPlans)
}
