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
	"github.com/google/uuid"
)

type BotScheduleHandler struct {
	repo       *repository.BotScheduleRepo
	auditLog   *repository.AuditLogRepo
	articleBot *service.ArticleBot
}

func NewBotScheduleHandler(repo *repository.BotScheduleRepo, auditLog *repository.AuditLogRepo, articleBot *service.ArticleBot) *BotScheduleHandler {
	return &BotScheduleHandler{repo: repo, auditLog: auditLog, articleBot: articleBot}
}

func (h *BotScheduleHandler) List(c fiber.Ctx) error {
	bots, err := h.repo.FindAll(c.Context())
	if err != nil {
		slog.Error("gagal list bot schedules", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if bots == nil {
		bots = []model.BotSchedule{}
	}
	return ok(c, bots)
}

func (h *BotScheduleHandler) GetByID(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	bot, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari bot schedule", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if bot == nil {
		return errResponse(c, apperr.NewNotFound("Bot Schedule"))
	}
	return ok(c, bot)
}

func (h *BotScheduleHandler) Create(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var req model.CreateBotScheduleRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	cfg := req.Config
	if cfg == nil {
		cfg = json.RawMessage(`{}`)
	}

	bot := model.BotSchedule{
		Name:       req.Name,
		BotType:    req.BotType,
		Schedule:   req.Schedule,
		Timezone:   req.Timezone,
		IsActive:   false,
		LastStatus: "idle",
		Config:     cfg,
	}

	if err := h.repo.Create(c.Context(), &bot); err != nil {
		slog.Error("gagal buat bot schedule", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Tambah bot: %s (%s)", bot.Name, bot.BotType)
	botID := bot.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "create", "bot_schedules", &botID, &desc, c.IP())

	return created(c, bot)
}

func (h *BotScheduleHandler) Update(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	existing, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari bot schedule", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if existing == nil {
		return errResponse(c, apperr.NewNotFound("Bot Schedule"))
	}

	var req model.UpdateBotScheduleRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	if req.Name != nil {
		existing.Name = *req.Name
	}
	if req.Schedule != nil {
		existing.Schedule = *req.Schedule
	}
	if req.Timezone != nil {
		existing.Timezone = *req.Timezone
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}
	if req.Config != nil {
		existing.Config = *req.Config
	}

	if err := h.repo.Update(c.Context(), existing); err != nil {
		slog.Error("gagal update bot schedule", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	action := "update"
	desc := fmt.Sprintf("Update bot: %s", existing.Name)
	if req.IsActive != nil {
		if *req.IsActive {
			action = "activate"
			desc = fmt.Sprintf("Aktifkan bot: %s", existing.Name)
		} else {
			action = "deactivate"
			desc = fmt.Sprintf("Nonaktifkan bot: %s", existing.Name)
		}
	}
	botID := existing.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, action, "bot_schedules", &botID, &desc, c.IP())

	return ok(c, existing)
}

func (h *BotScheduleHandler) Delete(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	existing, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari bot schedule", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if existing == nil {
		return errResponse(c, apperr.NewNotFound("Bot Schedule"))
	}

	if err := h.repo.Delete(c.Context(), id); err != nil {
		slog.Error("gagal hapus bot schedule", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Hapus bot: %s (%s)", existing.Name, existing.BotType)
	botID := existing.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "delete", "bot_schedules", &botID, &desc, c.IP())

	return c.Status(fiber.StatusNoContent).Send(nil)
}

// Trigger manually runs a bot (for testing)
func (h *BotScheduleHandler) Trigger(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	existing, err := h.repo.FindByID(c.Context(), id)
	if err != nil || existing == nil {
		return errResponse(c, apperr.NewNotFound("Bot Schedule"))
	}

	// Mark as running
	h.repo.UpdateRunStatus(c.Context(), id, "running", nil)

	desc := fmt.Sprintf("Trigger manual bot: %s", existing.Name)
	botID := existing.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "trigger", "bot_schedules", &botID, &desc, c.IP())

	// Run bot asynchronously
	go func() {
		slog.Info("bot-trigger: menjalankan bot", "name", existing.Name, "type", existing.BotType)
		var runErr error
		switch existing.BotType {
		case "article_generator":
			runErr = h.articleBot.RunWithConfig(c.Context(), existing.Config)
		default:
			slog.Warn("bot-trigger: tipe bot tidak dikenal", "type", existing.BotType)
			errMsg := "tipe bot tidak dikenal: " + existing.BotType
			h.repo.UpdateRunStatus(c.Context(), id, "error", &errMsg)
			return
		}

		status := "success"
		var errMsg *string
		if runErr != nil {
			status = "error"
			msg := runErr.Error()
			errMsg = &msg
			slog.Error("bot-trigger: gagal jalankan bot", "name", existing.Name, "error", runErr)
		} else {
			slog.Info("bot-trigger: bot berhasil", "name", existing.Name)
		}
		h.repo.UpdateRunStatus(c.Context(), id, status, errMsg)
	}()

	return ok(c, fiber.Map{"message": "Bot triggered", "bot_id": existing.ID})
}
