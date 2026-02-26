package handler

import (
	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type ExamHandler struct {
	uc *usecase.ExamUseCase
}

func NewExamHandler(uc *usecase.ExamUseCase) *ExamHandler {
	return &ExamHandler{uc: uc}
}

func (h *ExamHandler) GetExam(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	exam, err := h.uc.GetExam(c.Context(), id)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, exam)
}

func (h *ExamHandler) Submit(c fiber.Ctx) error {
	var req dto.SubmitExamRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	result, err := h.uc.SubmitExam(c.Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, result)
}

func (h *ExamHandler) Sync(c fiber.Ctx) error {
	var req dto.SyncAnswersRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	result, err := h.uc.SyncAnswers(c.Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, result)
}

func (h *ExamHandler) RegisterRoutes(router fiber.Router) {
	exams := router.Group("/exams")
	exams.Get("/:id", h.GetExam)
	exams.Post("/:id/submit", h.Submit)
	exams.Post("/:id/sync", h.Sync)
}
