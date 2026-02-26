package handler

import (
	"strconv"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type AssessorHandler struct {
	uc *usecase.AssessorUseCase
}

func NewAssessorHandler(uc *usecase.AssessorUseCase) *AssessorHandler {
	return &AssessorHandler{uc: uc}
}

func (h *AssessorHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	search := c.Query("search")

	assessors, total, err := h.uc.List(c.Context(), page, perPage, search)
	if err != nil {
		return handleError(c, err)
	}

	return response.Paginated(c, assessors, page, perPage, total)
}

func (h *AssessorHandler) GetByID(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	assessor, err := h.uc.GetByID(c.Context(), id)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, assessor)
}

func (h *AssessorHandler) Create(c fiber.Ctx) error {
	var req dto.CreateAssessorRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	assessor, err := h.uc.Create(c.Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return response.Created(c, assessor)
}

func (h *AssessorHandler) Update(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	var req dto.UpdateAssessorRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	assessor, err := h.uc.Update(c.Context(), id, req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, assessor)
}

func (h *AssessorHandler) RegisterRoutes(router fiber.Router) {
	assessors := router.Group("/assessors")
	assessors.Get("/", h.List)
	assessors.Get("/:id", h.GetByID)
	assessors.Post("/", h.Create)
	assessors.Put("/:id", h.Update)
}
