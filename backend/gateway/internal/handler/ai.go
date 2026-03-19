package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type AIHandler struct {
	cfg      config.AIConfig
	auditLog *repository.AuditLogRepo
}

func NewAIHandler(cfg config.AIConfig, auditLog *repository.AuditLogRepo) *AIHandler {
	return &AIHandler{cfg: cfg, auditLog: auditLog}
}

func (h *AIHandler) Generate(c fiber.Ctx) error {
	if h.cfg.APIKey == "" {
		return errResponse(c, apperr.NewServiceUnavailable("AI generation tidak dikonfigurasi"))
	}

	claims := middleware.GetClaims(c)

	var req model.AIGenerateRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	result, err := h.callClaudeAPI(req)
	if err != nil {
		slog.Error("gagal generate artikel AI", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	desc := fmt.Sprintf("Generate artikel AI: %s", req.Topic)
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "ai_generate", "articles", nil, &desc, c.IP())

	return ok(c, result)
}

func (h *AIHandler) callClaudeAPI(req model.AIGenerateRequest) (*model.AIGenerateResponse, error) {
	lang := "Bahasa Indonesia"
	if req.Language == "en" {
		lang = "English"
	}

	keywords := strings.Join(req.Keywords, ", ")
	if keywords == "" {
		keywords = req.Topic
	}

	systemPrompt := fmt.Sprintf(`Kamu adalah content writer profesional yang berpengalaman menulis artikel SEO-friendly.
Tulis artikel dalam %s dengan gaya %s.
Artikel harus natural, informatif, dan tidak terdeteksi sebagai tulisan AI.
Gunakan heading (##, ###), paragraf pendek, dan bullet points untuk readability.
Sertakan internal linking suggestion dengan format [text](url) ke halaman coreasia.id yang relevan:
- /products/pantau (web monitoring)
- /products/build (web development)
- /layanan/jasa-pembuatan-website
- /layanan/web-monitoring-dashboard
- /contact (konsultasi)
- /pricing (harga)`, lang, req.Tone)

	userPrompt := fmt.Sprintf(`Buatkan artikel blog tentang: %s

Target keyword: %s
Kategori: %s
Panjang: sekitar %d kata

Berikan response dalam format JSON:
{
  "title": "judul artikel yang SEO-friendly",
  "slug": "judul-artikel-dalam-format-slug",
  "description": "deskripsi singkat 1-2 kalimat untuk meta description",
  "content": "konten artikel dalam markdown",
  "tags": ["tag1", "tag2", "tag3"],
  "read_time": 5
}

Hanya berikan JSON, tanpa penjelasan tambahan.`, req.Topic, keywords, req.Category, req.WordCount)

	body := map[string]interface{}{
		"model":      h.cfg.Model,
		"max_tokens": 4096,
		"messages": []map[string]string{
			{"role": "user", "content": userPrompt},
		},
		"system": systemPrompt,
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshaling request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", h.cfg.APIKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("calling Claude API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		slog.Error("Claude API error", "status", resp.StatusCode, "body", string(respBody))
		return nil, fmt.Errorf("Claude API returned status %d", resp.StatusCode)
	}

	var claudeResp struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.Unmarshal(respBody, &claudeResp); err != nil {
		return nil, fmt.Errorf("parsing Claude response: %w", err)
	}

	if len(claudeResp.Content) == 0 {
		return nil, fmt.Errorf("empty response from Claude")
	}

	text := claudeResp.Content[0].Text
	// Strip markdown code fence if present
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	var result model.AIGenerateResponse
	if err := json.Unmarshal([]byte(text), &result); err != nil {
		return nil, fmt.Errorf("parsing AI article JSON: %w", err)
	}

	return &result, nil
}
