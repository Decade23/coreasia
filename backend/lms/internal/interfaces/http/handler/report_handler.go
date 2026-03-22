package handler

import (
	"log"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/application/usecase"
	"github.com/coreasia/lms-api/internal/domain/entity"
	infraRepo "github.com/coreasia/lms-api/internal/infrastructure/persistence/repository"
	"github.com/coreasia/lms-api/internal/interfaces/http/middleware"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/coreasia/lms-api/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type ReportHandler struct {
	uc        *usecase.ReportUseCase
	auditRepo *infraRepo.AuditLogRepo
}

func NewReportHandler(uc *usecase.ReportUseCase, auditRepo *infraRepo.AuditLogRepo) *ReportHandler {
	return &ReportHandler{uc: uc, auditRepo: auditRepo}
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

	claims := middleware.GetClaims(c)
	if claims == nil {
		return response.Error(c, apperr.NewUnauthorized("Token tidak valid"))
	}

	result, err := h.uc.BnspExport(c.Context(), req)
	if err != nil {
		return handleError(c, err)
	}

	userID := claims.UserID
	userName := claims.FullName
	userRole := claims.Role
	ipAddress := c.IP()
	description := "Menghasilkan export BNSP format " + req.Format + " untuk periode " + req.PeriodStart + " sampai " + req.PeriodEnd

	if err := h.auditRepo.Create(c.Context(), &entity.AuditLog{
		UserID:      &userID,
		UserName:    &userName,
		UserRole:    &userRole,
		Action:      "export",
		Resource:    "reports",
		Description: &description,
		IPAddress:   &ipAddress,
	}); err != nil {
		log.Printf("audit log create report export: %v", err)
	}

	return response.OK(c, result)
}

func (h *ReportHandler) RegisterRoutes(router fiber.Router) {
	reports := router.Group("/reports")
	reports.Get("/summary", h.Summary)
	reports.Post("/bnsp-export", h.BnspExport)
}
