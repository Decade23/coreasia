package handler

import (
	"strconv"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/interfaces/http/middleware"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	infraRepo "github.com/coreasia/lms-api/internal/infrastructure/persistence/repository"
	"github.com/gofiber/fiber/v3"
)

type TenantHandler struct {
	settingsRepo *infraRepo.TenantSettingsRepo
	auditRepo    *infraRepo.AuditLogRepo
	notifRepo    *infraRepo.NotificationRepo
}

func NewTenantHandler(settingsRepo *infraRepo.TenantSettingsRepo, auditRepo *infraRepo.AuditLogRepo, notifRepo *infraRepo.NotificationRepo) *TenantHandler {
	return &TenantHandler{settingsRepo: settingsRepo, auditRepo: auditRepo, notifRepo: notifRepo}
}

func (h *TenantHandler) GetSettings(c fiber.Ctx) error {
	settings, err := h.settingsRepo.GetAll(c.Context())
	if err != nil {
		return response.Error(c, apperr.NewInternal(err))
	}
	return response.OK(c, settings)
}

func (h *TenantHandler) UpdateSettings(c fiber.Ctx) error {
	var body map[string]interface{}
	if err := c.Bind().JSON(&body); err != nil {
		return response.Error(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	if err := h.settingsRepo.Update(c.Context(), body); err != nil {
		return response.Error(c, apperr.NewInternal(err))
	}

	return response.OK(c, body)
}

func (h *TenantHandler) GetAuditTrail(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	resource := c.Query("resource")

	logs, total, err := h.auditRepo.FindAll(c.Context(), page, perPage, resource)
	if err != nil {
		return response.Error(c, apperr.NewInternal(err))
	}

	return response.Paginated(c, logs, page, perPage, total)
}

func (h *TenantHandler) GetNotifications(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return response.Error(c, apperr.NewUnauthorized("Token tidak valid"))
	}

	notifications, err := h.notifRepo.FindByUser(c.Context(), claims.UserID)
	if err != nil {
		return response.Error(c, apperr.NewInternal(err))
	}

	return response.OK(c, notifications)
}

func (h *TenantHandler) MarkNotificationRead(c fiber.Ctx) error {
	id, appErr := parseUUID(c.Params("id"))
	if appErr != nil {
		return response.Error(c, appErr)
	}

	if err := h.notifRepo.MarkAsRead(c.Context(), id); err != nil {
		return response.Error(c, apperr.NewInternal(err))
	}

	return response.OK(c, &entity.Notification{ID: id, IsRead: true})
}

func (h *TenantHandler) RegisterRoutes(api fiber.Router, authMw fiber.Handler) {
	tenant := api.Group("/tenant", authMw)
	tenant.Get("/settings", h.GetSettings)
	tenant.Put("/settings", h.UpdateSettings)

	quality := api.Group("/quality", authMw)
	quality.Get("/audit-trail", h.GetAuditTrail)

	notif := api.Group("/notifications", authMw)
	notif.Get("/", h.GetNotifications)
	notif.Put("/:id/read", h.MarkNotificationRead)
}
