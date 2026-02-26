package handler

import (
	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/interfaces/http/middleware"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type AssessmentHandler struct {
	uc *usecase.AssessmentUseCase
}

func NewAssessmentHandler(uc *usecase.AssessmentUseCase) *AssessmentHandler {
	return &AssessmentHandler{uc: uc}
}

func (h *AssessmentHandler) GetUnits(c fiber.Ctx) error {
	schemeID, appErr := parseUUID(c.Query("scheme_id"))
	if appErr != nil {
		return response.Error(c, apperr.NewBadRequest("Parameter scheme_id wajib diisi"))
	}

	units, err := h.uc.GetUnits(c.Context(), schemeID)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, units)
}

func (h *AssessmentHandler) SubmitReview(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	var req dto.SubmitAssessmentRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	claims := middleware.GetClaims(c)
	if claims == nil {
		return response.Error(c, apperr.NewUnauthorized("Token tidak valid"))
	}

	result, err := h.uc.SubmitReview(c.Context(), id, claims.UserID, req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, result)
}

func (h *AssessmentHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/assessment/units", h.GetUnits)

	assessments := router.Group("/assessments")
	assessments.Put("/:id/submit", h.SubmitReview)
}
