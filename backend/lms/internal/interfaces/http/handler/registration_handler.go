package handler

import (
	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type RegistrationHandler struct {
	uc *usecase.RegistrationUseCase
}

func NewRegistrationHandler(uc *usecase.RegistrationUseCase) *RegistrationHandler {
	return &RegistrationHandler{uc: uc}
}

func (h *RegistrationHandler) Submit(c fiber.Ctx) error {
	var req dto.SubmitRegistrationRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	result, err := h.uc.Submit(c.Context(), req, c.IP())
	if err != nil {
		return handleError(c, err)
	}

	return response.Created(c, result)
}

func (h *RegistrationHandler) RegisterRoutes(router fiber.Router) {
	router.Post("/registrations", h.Submit)
}
