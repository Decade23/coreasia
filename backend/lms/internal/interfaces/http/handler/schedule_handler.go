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

type ScheduleHandler struct {
	uc *usecase.ScheduleUseCase
}

func NewScheduleHandler(uc *usecase.ScheduleUseCase) *ScheduleHandler {
	return &ScheduleHandler{uc: uc}
}

func (h *ScheduleHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	status := c.Query("status")

	schedules, total, err := h.uc.List(c.Context(), page, perPage, status)
	if err != nil {
		return handleError(c, err)
	}

	return response.Paginated(c, schedules, page, perPage, total)
}

func (h *ScheduleHandler) GetByID(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	schedule, err := h.uc.GetByID(c.Context(), id)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, schedule)
}

func (h *ScheduleHandler) Create(c fiber.Ctx) error {
	var req dto.CreateScheduleRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	schedule, err := h.uc.Create(c.Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return response.Created(c, schedule)
}

func (h *ScheduleHandler) Update(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	var req dto.UpdateScheduleRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	schedule, err := h.uc.Update(c.Context(), id, req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, schedule)
}

func (h *ScheduleHandler) Delete(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	if err := h.uc.Delete(c.Context(), id); err != nil {
		return handleError(c, err)
	}

	return response.NoContent(c)
}

func (h *ScheduleHandler) RegisterRoutes(router fiber.Router) {
	schedules := router.Group("/schedules")
	schedules.Get("/", h.List)
	schedules.Get("/:id", h.GetByID)
	schedules.Post("/", h.Create)
	schedules.Put("/:id", h.Update)
	schedules.Delete("/:id", h.Delete)
}
