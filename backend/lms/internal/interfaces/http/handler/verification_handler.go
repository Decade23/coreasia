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

type VerificationHandler struct {
	uc *usecase.VerificationUseCase
}

func NewVerificationHandler(uc *usecase.VerificationUseCase) *VerificationHandler {
	return &VerificationHandler{uc: uc}
}

func (h *VerificationHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	status := c.Query("status")

	verifications, total, err := h.uc.List(c.Context(), page, perPage, status)
	if err != nil {
		return handleError(c, err)
	}

	return response.Paginated(c, verifications, page, perPage, total)
}

func (h *VerificationHandler) GetByID(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	verification, err := h.uc.GetByID(c.Context(), id)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, verification)
}

func (h *VerificationHandler) Summary(c fiber.Ctx) error {
	summary, err := h.uc.Summary(c.Context())
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, summary)
}

func (h *VerificationHandler) UpdateStatus(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	var req dto.UpdateVerificationRequest
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

	verification, err := h.uc.UpdateStatus(c.Context(), id, claims.UserID, req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, verification)
}

func (h *VerificationHandler) RegisterRoutes(router fiber.Router) {
	verifications := router.Group("/verifications")
	verifications.Get("/", h.List)
	verifications.Get("/summary", h.Summary)
	verifications.Get("/:id", h.GetByID)
	verifications.Put("/:id", h.UpdateStatus)
}
