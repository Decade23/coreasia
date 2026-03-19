package handler

import (
	"strconv"

	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
)

type AuditHandler struct {
	auditLog *repository.AuditLogRepo
}

func NewAuditHandler(auditLog *repository.AuditLogRepo) *AuditHandler {
	return &AuditHandler{auditLog: auditLog}
}

func (h *AuditHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	resource := c.Query("resource")

	logs, total, err := h.auditLog.FindAll(c.Context(), page, perPage, resource)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}

	return paginated(c, logs, total, page, perPage)
}
