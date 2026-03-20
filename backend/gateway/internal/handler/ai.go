package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type AIHandler struct {
	articleBot *service.ArticleBot
	auditLog   *repository.AuditLogRepo
}

func NewAIHandler(articleBot *service.ArticleBot, auditLog *repository.AuditLogRepo) *AIHandler {
	return &AIHandler{articleBot: articleBot, auditLog: auditLog}
}

func (h *AIHandler) Generate(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var req model.AIGenerateRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	// Build config from request
	cfg := map[string]interface{}{
		"tone":       req.Tone,
		"language":   req.Language,
		"word_count": req.WordCount,
	}
	botConfig, _ := json.Marshal(cfg)

	if err := h.articleBot.RunWithConfig(c.Context(), botConfig); err != nil {
		slog.Error("gagal generate artikel AI", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Generate artikel AI: %s", req.Topic)
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "ai_generate", "articles", nil, &desc, c.IP())

	return ok(c, map[string]string{"message": "Artikel berhasil di-generate sebagai draft"})
}
