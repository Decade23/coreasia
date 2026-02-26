package handler

import (
	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type ReportHandler struct {
	uc *usecase.ReportUseCase
}

func NewReportHandler(uc *usecase.ReportUseCase) *ReportHandler {
	return &ReportHandler{uc: uc}
}

func (h *ReportHandler) Summary(c fiber.Ctx) error {
	summary, err := h.uc.Summary(c.Context())
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, summary)
}

func (h *ReportHandler) BnspExport(c fiber.Ctx) error {
	var req dto.BnspExportRequest
	if err := c.Bind().JSON(&req); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return response.Error(c, appErr)
	}

	result, err := h.uc.BnspExport(c.Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	return response.OK(c, result)
}

func (h *ReportHandler) RegisterRoutes(router fiber.Router) {
	reports := router.Group("/reports")
	reports.Get("/summary", h.Summary)
	reports.Post("/bnsp-export", h.BnspExport)
}
