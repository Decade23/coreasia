package handler

import (
	"strconv"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/interfaces/http/middleware"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type QualityHandler struct {
	uc *usecase.QualityUseCase
}

func NewQualityHandler(uc *usecase.QualityUseCase) *QualityHandler {
	return &QualityHandler{uc: uc}
}

func (h *QualityHandler) Stats(c fiber.Ctx) error {
	stats, err := h.uc.Stats(c.Context())
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, stats)
}

func (h *QualityHandler) ListReviews(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	status := c.Query("status")

	reviews, total, err := h.uc.ListReviews(c.Context(), page, perPage, status)
	if err != nil {
		return handleError(c, err)
	}

	return response.Paginated(c, reviews, page, perPage, total)
}

func (h *QualityHandler) UpdateReview(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	var req dto.UpdateQualityReviewRequest
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

	review, err := h.uc.UpdateReview(c.Context(), id, claims.UserID, req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, review)
}

func (h *QualityHandler) RegisterRoutes(router fiber.Router) {
	quality := router.Group("/quality")
	quality.Get("/stats", h.Stats)
	quality.Get("/reviews", h.ListReviews)
	quality.Put("/reviews/:id", h.UpdateReview)
}
