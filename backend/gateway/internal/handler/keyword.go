package handler

import (
	"fmt"
	"log/slog"
	"strconv"

	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type KeywordHandler struct {
	repo              *repository.KeywordRepo
	auditLog          *repository.AuditLogRepo
	apiKeyRepo        *repository.APIKeyRepo
	settingsRepo      *repository.AppSettingsRepo
	keywordSuggester  *service.KeywordSuggester
}

func NewKeywordHandler(repo *repository.KeywordRepo, auditLog *repository.AuditLogRepo, apiKeyRepo *repository.APIKeyRepo, settingsRepo *repository.AppSettingsRepo) *KeywordHandler {
	return &KeywordHandler{repo: repo, auditLog: auditLog, apiKeyRepo: apiKeyRepo, settingsRepo: settingsRepo, keywordSuggester: service.NewKeywordSuggester()}
}

func (h *KeywordHandler) List(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "20"))
	filter := model.KeywordListFilter{
		Page:     page,
		PerPage:  perPage,
		Status:   c.Query("status"),
		Category: c.Query("category"),
		Search:   c.Query("search"),
		SortBy:   c.Query("sort_by"),
	}

	keywords, total, err := h.repo.FindAll(c.Context(), filter)
	if err != nil {
		slog.Error("gagal list keywords", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if keywords == nil {
		keywords = []model.Keyword{}
	}
	return paginated(c, keywords, total, filter.Page, filter.PerPage)
}

func (h *KeywordHandler) Stats(c fiber.Ctx) error {
	stats, err := h.repo.Stats(c.Context())
	if err != nil {
		slog.Error("gagal ambil keyword stats", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	return ok(c, stats)
}

func (h *KeywordHandler) GetByID(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	keyword, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari keyword", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if keyword == nil {
		return errResponse(c, apperr.NewNotFound("Keyword"))
	}
	return ok(c, keyword)
}

func (h *KeywordHandler) Create(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var req model.CreateKeywordRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	keyword := model.Keyword{
		Keyword:      req.Keyword,
		Category:     req.Category,
		SearchVolume: req.SearchVolume,
		Difficulty:   req.Difficulty,
		Priority:     req.Priority,
		Source:       "manual",
		CreatedBy:    &claims.UserID,
	}

	if err := h.repo.Create(c.Context(), &keyword); err != nil {
		slog.Error("gagal buat keyword", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Tambah keyword: %s (kategori: %s, prioritas: %d)", keyword.Keyword, keyword.Category, keyword.Priority)
	kwID := keyword.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "create", "keywords", &kwID, &desc, c.IP())

	return created(c, keyword)
}

func (h *KeywordHandler) CreateBatch(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var req struct {
		Keywords []model.CreateKeywordRequest `json:"keywords" validate:"required,min=1"`
		Source   string                       `json:"source"`
	}
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if len(req.Keywords) == 0 {
		return errResponse(c, apperr.NewBadRequest("Minimal 1 keyword"))
	}

	source := "manual"
	if req.Source == "ai_suggested" {
		source = "ai_suggested"
	}

	keywords := make([]model.Keyword, len(req.Keywords))
	for i, r := range req.Keywords {
		keywords[i] = model.Keyword{
			Keyword:      r.Keyword,
			Category:     r.Category,
			SearchVolume: r.SearchVolume,
			Difficulty:   r.Difficulty,
			Priority:     r.Priority,
			Source:       source,
			CreatedBy:    &claims.UserID,
		}
	}

	if err := h.repo.CreateBatch(c.Context(), keywords); err != nil {
		slog.Error("gagal batch buat keywords", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Batch tambah %d keyword (source: %s)", len(keywords), source)
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "create_batch", "keywords", nil, &desc, c.IP())

	return created(c, fiber.Map{"count": len(keywords)})
}

func (h *KeywordHandler) Update(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	existing, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari keyword", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if existing == nil {
		return errResponse(c, apperr.NewNotFound("Keyword"))
	}

	var req model.UpdateKeywordRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	if req.Keyword != nil {
		existing.Keyword = *req.Keyword
	}
	if req.Category != nil {
		existing.Category = *req.Category
	}
	if req.SearchVolume != nil {
		existing.SearchVolume = req.SearchVolume
	}
	if req.Difficulty != nil {
		existing.Difficulty = req.Difficulty
	}
	if req.Priority != nil {
		existing.Priority = *req.Priority
	}
	if req.Status != nil {
		existing.Status = *req.Status
	}

	if err := h.repo.Update(c.Context(), existing); err != nil {
		slog.Error("gagal update keyword", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Update keyword: %s", existing.Keyword)
	kwID := existing.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "update", "keywords", &kwID, &desc, c.IP())

	return ok(c, existing)
}

func (h *KeywordHandler) Delete(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	existing, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari keyword", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if existing == nil {
		return errResponse(c, apperr.NewNotFound("Keyword"))
	}

	if err := h.repo.Delete(c.Context(), id); err != nil {
		slog.Error("gagal hapus keyword", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Hapus keyword: %s (%s)", existing.Keyword, existing.Category)
	kwID := existing.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "delete", "keywords", &kwID, &desc, c.IP())

	return c.Status(fiber.StatusNoContent).Send(nil)
}

func (h *KeywordHandler) AISuggest(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var req model.AIKeywordSuggestRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	// Load provider/model from settings
	provider := "claude"
	aiModel := ""
	if h.settingsRepo != nil {
		if p, err := h.settingsRepo.Get(c.Context(), "ai_provider"); err == nil && p != "" {
			provider = p
		}
		if m, err := h.settingsRepo.Get(c.Context(), "ai_model"); err == nil && m != "" {
			aiModel = m
		}
	}

	// Load API key
	apiKey := ""
	if dbKey, err := h.apiKeyRepo.FindActiveByProvider(c.Context(), provider); err == nil && dbKey != nil {
		apiKey = dbKey.KeyValue
	}
	if apiKey == "" {
		return errResponse(c, apperr.NewBadRequest("API key belum dikonfigurasi untuk provider "+provider))
	}

	result, err := h.keywordSuggester.SuggestKeywords(req, provider, aiModel, apiKey)
	if err != nil {
		slog.Error("gagal suggest keywords", "error", err, "provider", provider)
		msg := service.ClassifyBotError(err)
		return errResponse(c, apperr.NewBadRequest(msg))
	}

	desc := fmt.Sprintf("AI suggest %d keywords (niche: %s)", len(result.Suggestions), req.Niche)
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "ai_suggest", "keywords", nil, &desc, c.IP())

	return ok(c, result)
}
