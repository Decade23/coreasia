package handler

import (
	"strconv"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type QuestionHandler struct {
	uc *usecase.QuestionUseCase
}

func NewQuestionHandler(uc *usecase.QuestionUseCase) *QuestionHandler {
	return &QuestionHandler{uc: uc}
}

func (h *QuestionHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	questionType := c.Query("type")
	difficulty := c.Query("difficulty")

	var schemeID *uuid.UUID
	if sid := c.Query("scheme_id"); sid != "" {
		parsed, err := uuid.Parse(sid)
		if err == nil {
			schemeID = &parsed
		}
	}

	questions, total, err := h.uc.List(c.Context(), page, perPage, schemeID, questionType, difficulty)
	if err != nil {
		return handleError(c, err)
	}

	return response.Paginated(c, questions, page, perPage, total)
}

func (h *QuestionHandler) GetByID(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	question, err := h.uc.GetByID(c.Context(), id)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, question)
}

func (h *QuestionHandler) Create(c fiber.Ctx) error {
	var req dto.CreateQuestionRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	question, err := h.uc.Create(c.Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return response.Created(c, question)
}

func (h *QuestionHandler) Update(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	var req dto.UpdateQuestionRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	question, err := h.uc.Update(c.Context(), id, req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, question)
}

func (h *QuestionHandler) Delete(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	if err := h.uc.Delete(c.Context(), id); err != nil {
		return handleError(c, err)
	}

	return response.NoContent(c)
}

func (h *QuestionHandler) RegisterRoutes(router fiber.Router) {
	questions := router.Group("/questions")
	questions.Get("/", h.List)
	questions.Get("/:id", h.GetByID)
	questions.Post("/", h.Create)
	questions.Put("/:id", h.Update)
	questions.Delete("/:id", h.Delete)
}
