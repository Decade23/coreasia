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

type SchemeHandler struct {
	uc *usecase.SchemeUseCase
}

func NewSchemeHandler(uc *usecase.SchemeUseCase) *SchemeHandler {
	return &SchemeHandler{uc: uc}
}

func (h *SchemeHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	search := c.Query("search")

	schemes, total, err := h.uc.List(c.Context(), page, perPage, search)
	if err != nil {
		return handleError(c, err)
	}

	return response.Paginated(c, schemes, page, perPage, total)
}

func (h *SchemeHandler) GetByID(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	scheme, err := h.uc.GetByID(c.Context(), id)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, scheme)
}

func (h *SchemeHandler) Create(c fiber.Ctx) error {
	var req dto.CreateSchemeRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	scheme, err := h.uc.Create(c.Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return response.Created(c, scheme)
}

func (h *SchemeHandler) Update(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	var req dto.UpdateSchemeRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	scheme, err := h.uc.Update(c.Context(), id, req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, scheme)
}

func (h *SchemeHandler) Delete(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	if err := h.uc.Delete(c.Context(), id); err != nil {
		return handleError(c, err)
	}

	return response.NoContent(c)
}

func (h *SchemeHandler) RegisterRoutes(router fiber.Router) {
	schemes := router.Group("/schemes")
	schemes.Get("/", h.List)
	schemes.Get("/:id", h.GetByID)
	schemes.Post("/", h.Create)
	schemes.Put("/:id", h.Update)
	schemes.Delete("/:id", h.Delete)
}

func handleError(c fiber.Ctx, err error) error {
	if appErr, ok := err.(*apperr.AppError); ok {
		return response.Error(c, appErr)
	}
	return response.Error(c, apperr.NewInternal(err))
}
