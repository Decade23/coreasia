package handler

import (
	"fmt"
	"log/slog"

	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type APIKeyHandler struct {
	repo     *repository.APIKeyRepo
	auditLog *repository.AuditLogRepo
}

func NewAPIKeyHandler(repo *repository.APIKeyRepo, auditLog *repository.AuditLogRepo) *APIKeyHandler {
	return &APIKeyHandler{repo: repo, auditLog: auditLog}
}

func (h *APIKeyHandler) List(c fiber.Ctx) error {
	keys, err := h.repo.FindAll(c.Context())
	if err != nil {
		slog.Error("gagal list api keys", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	// Return masked keys
	responses := make([]model.APIKeyResponse, len(keys))
	for i, k := range keys {
		responses[i] = k.ToResponse()
	}
	return ok(c, responses)
}

func (h *APIKeyHandler) GetByID(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	key, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari api key", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if key == nil {
		return errResponse(c, apperr.NewNotFound("API Key"))
	}

	return ok(c, key.ToResponse())
}

// CopyKey returns the full key value (for copy-to-clipboard). Audit logged.
func (h *APIKeyHandler) CopyKey(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	key, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari api key untuk copy", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if key == nil {
		return errResponse(c, apperr.NewNotFound("API Key"))
	}

	claims := middleware.GetClaims(c)
	desc := fmt.Sprintf("Salin API key: %s (%s)", key.Name, key.Provider)
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "copy", "api_keys", nil, &desc, c.IP())

	return ok(c, fiber.Map{"key_value": key.KeyValue})
}

func (h *APIKeyHandler) Create(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var req model.CreateAPIKeyRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	key := model.APIKey{
		Name:        req.Name,
		Provider:    req.Provider,
		KeyValue:    req.KeyValue,
		Description: req.Description,
		IsActive:    true,
		CreatedBy:   &claims.UserID,
	}

	if err := h.repo.Create(c.Context(), &key); err != nil {
		slog.Error("gagal buat api key", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Tambah API key: %s (%s)", key.Name, key.Provider)
	keyID := key.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "create", "api_keys", &keyID, &desc, c.IP())

	return created(c, key.ToResponse())
}

func (h *APIKeyHandler) Update(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	existing, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari api key", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if existing == nil {
		return errResponse(c, apperr.NewNotFound("API Key"))
	}

	var req model.UpdateAPIKeyRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	if req.Name != nil {
		existing.Name = *req.Name
	}
	if req.Provider != nil {
		existing.Provider = *req.Provider
	}
	if req.KeyValue != nil {
		existing.KeyValue = *req.KeyValue
	}
	if req.Description != nil {
		existing.Description = req.Description
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}

	if err := h.repo.Update(c.Context(), existing); err != nil {
		slog.Error("gagal update api key", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Update API key: %s (%s)", existing.Name, existing.Provider)
	keyID := existing.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "update", "api_keys", &keyID, &desc, c.IP())

	return ok(c, existing.ToResponse())
}

func (h *APIKeyHandler) Delete(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	existing, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari api key", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if existing == nil {
		return errResponse(c, apperr.NewNotFound("API Key"))
	}

	if err := h.repo.Delete(c.Context(), id); err != nil {
		slog.Error("gagal hapus api key", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Hapus API key: %s (%s)", existing.Name, existing.Provider)
	keyID := existing.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "delete", "api_keys", &keyID, &desc, c.IP())

	return c.Status(fiber.StatusNoContent).Send(nil)
}
