package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type AIHandler struct {
	articleBot  *service.ArticleBot
	auditLog    *repository.AuditLogRepo
	apiKeyRepo  *repository.APIKeyRepo
	settingsRepo *repository.AppSettingsRepo
}

func NewAIHandler(articleBot *service.ArticleBot, auditLog *repository.AuditLogRepo, apiKeyRepo *repository.APIKeyRepo, settingsRepo *repository.AppSettingsRepo) *AIHandler {
	return &AIHandler{articleBot: articleBot, auditLog: auditLog, apiKeyRepo: apiKeyRepo, settingsRepo: settingsRepo}
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

	cfg := map[string]interface{}{
		"tone":       req.Tone,
		"language":   req.Language,
		"word_count": req.WordCount,
	}
	botConfig, _ := json.Marshal(cfg)

	if err := h.articleBot.RunWithConfig(c.Context(), botConfig); err != nil {
		slog.Error("gagal generate artikel AI", "error", err)
		msg := classifyAIError(err)
		return errResponse(c, apperr.NewServiceUnavailable(msg))
	}

	desc := fmt.Sprintf("Generate artikel AI: %s", req.Topic)
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "ai_generate", "articles", nil, &desc, c.IP())

	return ok(c, map[string]string{"message": "Artikel berhasil di-generate sebagai draft"})
}

// GetSettings returns AI configuration.
func (h *AIHandler) GetSettings(c fiber.Ctx) error {
	settings, err := h.settingsRepo.GetAll(c.Context())
	if err != nil {
		slog.Error("gagal get AI settings", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	return ok(c, settings)
}

// UpdateSettings saves AI configuration.
func (h *AIHandler) UpdateSettings(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var req map[string]string
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	if err := h.settingsRepo.SetMultiple(c.Context(), req, &claims.UserID); err != nil {
		slog.Error("gagal update AI settings", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Update pengaturan AI: provider=%s model=%s", req["ai_provider"], req["ai_model"])
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "update", "ai_settings", nil, &desc, c.IP())

	return ok(c, map[string]string{"message": "Pengaturan AI berhasil disimpan"})
}

// classifyAIError converts raw AI errors into user-friendly messages.
func classifyAIError(err error) string {
	msg := err.Error()
	switch {
	case strings.Contains(msg, "credit balance is too low"):
		return "Credit API habis. Isi ulang credit di dashboard provider AI Anda."
	case strings.Contains(msg, "API key belum dikonfigurasi"):
		return "API key belum dikonfigurasi. Tambahkan API key di halaman API Keys."
	case strings.Contains(msg, "invalid x-api-key"), strings.Contains(msg, "Incorrect API key"), strings.Contains(msg, "invalid_api_key"):
		return "API key tidak valid. Periksa kembali key yang tersimpan."
	case strings.Contains(msg, "rate limit"), strings.Contains(msg, "429"):
		return "Rate limit tercapai. Coba lagi dalam beberapa menit."
	case strings.Contains(msg, "model"), strings.Contains(msg, "not found"):
		return "Model AI tidak ditemukan. Periksa konfigurasi model di pengaturan bot."
	case strings.Contains(msg, "timeout"), strings.Contains(msg, "deadline"):
		return "Request timeout. Server AI tidak merespons, coba lagi nanti."
	case strings.Contains(msg, "provider") && strings.Contains(msg, "tidak didukung"):
		return msg
	default:
		return "Gagal generate artikel. Periksa konfigurasi AI dan coba lagi."
	}
}

// ListModels fetches available models from the provider's API using the stored API key.
func (h *AIHandler) ListModels(c fiber.Ctx) error {
	provider := c.Params("provider")

	dbKey, err := h.apiKeyRepo.FindActiveByProvider(c.Context(), provider)
	if err != nil || dbKey == nil {
		return errResponse(c, apperr.NewBadRequest("API key belum dikonfigurasi untuk provider: "+provider))
	}

	models, err := fetchModelsFromProvider(provider, dbKey.KeyValue)
	if err != nil {
		slog.Error("gagal fetch models", "provider", provider, "error", err)
		return errResponse(c, apperr.NewServiceUnavailable("Gagal mengambil daftar model dari "+provider))
	}

	return ok(c, models)
}

type aiModel struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func fetchModelsFromProvider(provider, apiKey string) ([]aiModel, error) {
	switch provider {
	case "claude", "anthropic":
		return fetchClaudeModels(apiKey)
	case "openai":
		return fetchOpenAIModels(apiKey, "https://api.openai.com/v1/models")
	case "groq":
		return fetchOpenAIModels(apiKey, "https://api.groq.com/openai/v1/models")
	case "gemini":
		return fetchGeminiModels(apiKey)
	default:
		return nil, fmt.Errorf("provider %q tidak didukung", provider)
	}
}

func fetchClaudeModels(apiKey string) ([]aiModel, error) {
	req, _ := http.NewRequest("GET", "https://api.anthropic.com/v1/models", nil)
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Anthropic API returned %d", resp.StatusCode)
	}

	var result struct {
		Data []struct {
			ID          string `json:"id"`
			DisplayName string `json:"display_name"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	models := make([]aiModel, 0, len(result.Data))
	for _, m := range result.Data {
		name := m.DisplayName
		if name == "" {
			name = m.ID
		}
		models = append(models, aiModel{ID: m.ID, Name: name})
	}
	return models, nil
}

func fetchOpenAIModels(apiKey, baseURL string) ([]aiModel, error) {
	req, _ := http.NewRequest("GET", baseURL, nil)
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned %d", resp.StatusCode)
	}

	var result struct {
		Data []struct {
			ID      string `json:"id"`
			OwnedBy string `json:"owned_by"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	models := make([]aiModel, 0)
	for _, m := range result.Data {
		// Filter: only show chat/text models, skip embedding/whisper/tts/dall-e
		id := strings.ToLower(m.ID)
		if strings.Contains(id, "embedding") || strings.Contains(id, "whisper") ||
			strings.Contains(id, "tts") || strings.Contains(id, "dall-e") ||
			strings.Contains(id, "moderation") {
			continue
		}
		models = append(models, aiModel{ID: m.ID, Name: m.ID})
	}
	return models, nil
}

func fetchGeminiModels(apiKey string) ([]aiModel, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models?key=%s", apiKey)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Gemini API returned %d", resp.StatusCode)
	}

	var result struct {
		Models []struct {
			Name        string `json:"name"`
			DisplayName string `json:"displayName"`
		} `json:"models"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	models := make([]aiModel, 0)
	for _, m := range result.Models {
		id := strings.TrimPrefix(m.Name, "models/")
		// Filter: only generateContent-capable models
		if strings.Contains(id, "embedding") || strings.Contains(id, "aqa") {
			continue
		}
		name := m.DisplayName
		if name == "" {
			name = id
		}
		models = append(models, aiModel{ID: id, Name: name})
	}
	return models, nil
}
