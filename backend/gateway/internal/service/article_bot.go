package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
)

// ClassifyBotError converts raw AI/bot errors into user-friendly messages.
// Sensitive details stay in server logs only.
func ClassifyBotError(err error) string {
	msg := err.Error()
	lower := strings.ToLower(msg)
	switch {
	case strings.Contains(lower, "credit balance is too low"), strings.Contains(lower, "insufficient_quota"), strings.Contains(lower, "billing"):
		return "Credit API habis. Isi ulang credit di dashboard provider."
	case strings.Contains(msg, "API key belum dikonfigurasi"):
		return "API key belum dikonfigurasi. Tambahkan di halaman API Keys."
	case strings.Contains(lower, "invalid x-api-key"), strings.Contains(lower, "incorrect api key"),
		strings.Contains(lower, "invalid_api_key"), strings.Contains(lower, "authentication"),
		strings.Contains(lower, "unauthorized"), strings.Contains(lower, "status 401"):
		return "API key tidak valid atau sudah kedaluwarsa."
	case strings.Contains(lower, "rate limit"), strings.Contains(lower, "429"), strings.Contains(lower, "too many requests"):
		return "Rate limit tercapai. Coba lagi dalam beberapa menit."
	case strings.Contains(lower, "overloaded"), strings.Contains(lower, "status 529"), strings.Contains(lower, "status 503"):
		return "Server AI sedang overload. Coba lagi nanti."
	case strings.Contains(lower, "model") && (strings.Contains(lower, "not found") || strings.Contains(lower, "does not exist")),
		strings.Contains(lower, "status 404"):
		return "Model tidak ditemukan. Periksa konfigurasi model."
	case strings.Contains(lower, "timeout"), strings.Contains(lower, "deadline"), strings.Contains(lower, "context canceled"):
		return "Request timeout. Coba lagi nanti."
	case strings.Contains(lower, "permission"), strings.Contains(lower, "status 403"):
		return "API key tidak memiliki akses ke model ini."
	case strings.Contains(lower, "parsing ai article json"):
		return "Respons AI dalam format tidak valid. Coba generate ulang."
	case strings.Contains(lower, "empty response"):
		return "Respons AI kosong. Coba generate ulang atau ganti model."
	case strings.Contains(lower, "provider") && strings.Contains(lower, "tidak didukung"):
		return msg
	default:
		return "Gagal generate artikel. Periksa konfigurasi dan coba lagi."
	}
}

// ArticleBot generates articles automatically using AI.
// Supports multiple providers: claude, openai, groq, gemini.
type ArticleBot struct {
	cfg          config.AIConfig
	articleRepo  *repository.ArticleRepo
	auditRepo    *repository.AuditLogRepo
	apiKeyRepo   *repository.APIKeyRepo
	settingsRepo *repository.AppSettingsRepo
}

func NewArticleBot(cfg config.AIConfig, articleRepo *repository.ArticleRepo, auditRepo *repository.AuditLogRepo, apiKeyRepo *repository.APIKeyRepo, settingsRepo *repository.AppSettingsRepo) *ArticleBot {
	return &ArticleBot{cfg: cfg, articleRepo: articleRepo, auditRepo: auditRepo, apiKeyRepo: apiKeyRepo, settingsRepo: settingsRepo}
}

// topicPool contains potential article topics grouped by category.
var topicPool = []struct {
	Category string
	Topics   []string
}{
	{"seo", []string{
		"Cara Meningkatkan Peringkat Google untuk Website Bisnis",
		"Strategi SEO On-Page yang Wajib Diterapkan di 2026",
		"Panduan Technical SEO untuk Pemula",
		"Cara Riset Keyword yang Efektif untuk Konten Website",
		"Pengaruh Core Web Vitals terhadap SEO dan Cara Optimasinya",
		"Link Building: Strategi Backlink yang Aman untuk 2026",
		"SEO Lokal: Cara Mendominasi Pencarian di Wilayah Bisnis Anda",
	}},
	{"teknologi", []string{
		"Apa Itu Web Monitoring dan Mengapa Bisnis Membutuhkannya",
		"Perbedaan Website Statis dan Dinamis: Mana yang Cocok untuk Bisnis Anda",
		"Pentingnya SSL Certificate untuk Keamanan Website",
		"Cloud Hosting vs Shared Hosting: Panduan Memilih yang Tepat",
		"Cara Mengukur dan Meningkatkan Kecepatan Website",
		"Progressive Web App (PWA): Masa Depan Aplikasi Mobile",
		"API Integration: Menghubungkan Sistem Bisnis Anda",
	}},
	{"bisnis", []string{
		"Panduan Memilih Software House di Indonesia",
		"ROI Digital Transformation: Cara Mengukur Keberhasilan Investasi IT",
		"Kenapa Bisnis Perlu Memiliki Website Profesional",
		"Strategi Digital untuk UMKM yang Ingin Go Online",
		"Outsourcing IT vs In-house: Pro Kontra untuk Bisnis",
		"Cara Membuat Proposal Proyek IT yang Meyakinkan",
	}},
	{"marketing", []string{
		"Tips Membangun Landing Page yang Konversi Tinggi",
		"Strategi Content Marketing untuk B2B di Indonesia",
		"Email Marketing: Cara Membangun List dan Meningkatkan Open Rate",
		"Social Media Marketing untuk Perusahaan IT",
		"Cara Menggunakan Google Analytics 4 untuk Mengukur Performa Website",
		"Strategi Remarketing yang Efektif untuk Meningkatkan Konversi",
	}},
	{"edukasi", []string{
		"Keuntungan Menggunakan LMS untuk Training Karyawan",
		"Cara Merancang Program E-Learning yang Efektif",
		"Microlearning: Tren Pelatihan yang Efisien untuk Tim Anda",
		"Gamifikasi dalam E-Learning: Meningkatkan Engagement Peserta",
	}},
}

// RunWithConfig runs the bot with provider/model from bot schedule config.
func (b *ArticleBot) RunWithConfig(ctx context.Context, botConfig json.RawMessage) error {
	// Parse bot config for provider/model overrides
	var cfg struct {
		Provider  string `json:"provider"`
		Model     string `json:"model"`
		Tone      string `json:"tone"`
		Language  string `json:"language"`
		WordCount int    `json:"word_count"`
	}
	if len(botConfig) > 0 {
		_ = json.Unmarshal(botConfig, &cfg)
	}

	// Priority: bot config > app_settings > env config
	provider := b.cfg.Provider
	aiModel := b.cfg.Model

	// Try app_settings (global AI settings from admin panel)
	if b.settingsRepo != nil {
		if dbProvider, err := b.settingsRepo.Get(ctx, "ai_provider"); err == nil && dbProvider != "" {
			provider = dbProvider
		}
		if dbModel, err := b.settingsRepo.Get(ctx, "ai_model"); err == nil && dbModel != "" {
			aiModel = dbModel
		}
	}

	// Bot-specific overrides take highest priority
	if cfg.Provider != "" {
		provider = cfg.Provider
	}
	if cfg.Model != "" {
		aiModel = cfg.Model
	}
	tone := "professional"
	if cfg.Tone != "" {
		tone = cfg.Tone
	}
	language := "id"
	if cfg.Language != "" {
		language = cfg.Language
	}
	wordCount := 1200
	if cfg.WordCount > 0 {
		wordCount = cfg.WordCount
	}

	// Load API key from DB (by provider), fallback to env
	apiKey := ""
	if dbKey, err := b.apiKeyRepo.FindActiveByProvider(ctx, provider); err == nil && dbKey != nil {
		apiKey = dbKey.KeyValue
	}
	if apiKey == "" {
		apiKey = b.cfg.APIKey
	}
	if apiKey == "" {
		return fmt.Errorf("API key belum dikonfigurasi untuk provider %q (env atau DB)", provider)
	}

	// Fetch existing article titles to avoid duplicates
	existing, _, err := b.articleRepo.FindAll(ctx, model.ArticleListFilter{Page: 1, PerPage: 500})
	if err != nil {
		return fmt.Errorf("gagal fetch existing articles: %w", err)
	}

	existingTitles := make(map[string]bool)
	for _, a := range existing {
		existingTitles[strings.ToLower(a.Title)] = true
	}

	topic, category := b.pickTopic(existingTitles)
	if topic == "" {
		slog.Info("article-bot: semua topik sudah ditulis, skip")
		return nil
	}

	slog.Info("article-bot: generating article", "topic", topic, "category", category, "provider", provider, "model", aiModel)

	req := model.AIGenerateRequest{
		Topic:     topic,
		Keywords:  []string{category, "coreasia", "bisnis digital"},
		Tone:      tone,
		Language:  language,
		WordCount: wordCount,
		Category:  category,
	}

	result, err := b.callAI(provider, aiModel, apiKey, req)
	if err != nil {
		return fmt.Errorf("gagal generate artikel via %s: %w", provider, err)
	}

	// Save as draft
	article := model.Article{
		Title:          result.Title,
		Slug:           result.Slug,
		Description:    result.Description,
		Content:        result.Content,
		Category:       category,
		Tags:           result.Tags,
		Author:         "CoreAsia Bot",
		ReadTime:       result.ReadTime,
		Status:         "draft",
		SEOTitle:       &result.Title,
		SEODescription: &result.Description,
	}

	if err := b.articleRepo.Create(ctx, &article); err != nil {
		return fmt.Errorf("gagal simpan artikel: %w", err)
	}

	desc := fmt.Sprintf("Bot auto-generated artikel via %s/%s: %s", provider, aiModel, article.Title)
	botName := "ArticleBot"
	articleID := article.ID.String()
	b.auditRepo.LogAction(ctx, nil, &botName, "ai_generate", "articles", &articleID, &desc, "system")

	slog.Info("article-bot: artikel berhasil dibuat", "title", article.Title, "id", article.ID, "provider", provider)
	return nil
}

// Run is the legacy entrypoint — uses default config.
func (b *ArticleBot) Run(ctx context.Context) error {
	defaultConfig, _ := json.Marshal(map[string]interface{}{
		"provider":   b.cfg.Provider,
		"model":      b.cfg.Model,
		"tone":       "professional",
		"language":   "id",
		"word_count": 1200,
	})
	return b.RunWithConfig(ctx, defaultConfig)
}

func (b *ArticleBot) pickTopic(existing map[string]bool) (string, string) {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	indices := r.Perm(len(topicPool))

	for _, ci := range indices {
		cat := topicPool[ci]
		ti := r.Perm(len(cat.Topics))
		for _, j := range ti {
			topic := cat.Topics[j]
			if !existing[strings.ToLower(topic)] {
				return topic, cat.Category
			}
		}
	}
	return "", ""
}

// callAI dispatches to the correct provider.
func (b *ArticleBot) callAI(provider, aiModel, apiKey string, req model.AIGenerateRequest) (*model.AIGenerateResponse, error) {
	systemPrompt, userPrompt := b.buildPrompts(req)

	switch provider {
	case "claude", "anthropic":
		return b.callClaude(aiModel, apiKey, systemPrompt, userPrompt)
	case "openai":
		return b.callOpenAICompat("https://api.openai.com/v1/chat/completions", aiModel, apiKey, systemPrompt, userPrompt)
	case "groq":
		return b.callOpenAICompat("https://api.groq.com/openai/v1/chat/completions", aiModel, apiKey, systemPrompt, userPrompt)
	case "gemini":
		return b.callGemini(aiModel, apiKey, systemPrompt, userPrompt)
	default:
		return nil, fmt.Errorf("provider %q tidak didukung", provider)
	}
}

func (b *ArticleBot) buildPrompts(req model.AIGenerateRequest) (string, string) {
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
  "content": "konten artikel dalam format HTML (gunakan <h2>, <h3>, <p>, <ul>, <li>, <strong>, <a> tags)",
  "tags": ["tag1", "tag2", "tag3"],
  "read_time": 5
}

Hanya berikan JSON, tanpa penjelasan tambahan.`, req.Topic, keywords, req.Category, req.WordCount)

	return systemPrompt, userPrompt
}

func (b *ArticleBot) parseArticleJSON(raw []byte) (*model.AIGenerateResponse, error) {
	text := string(raw)
	text = strings.TrimSpace(text)

	// Strip markdown code fences (```json ... ``` or ``` ... ```)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	// Extract JSON object between first { and last } as fallback
	startIdx := strings.Index(text, "{")
	endIdx := strings.LastIndex(text, "}")
	if startIdx >= 0 && endIdx > startIdx {
		text = text[startIdx : endIdx+1]
	}

	var result model.AIGenerateResponse
	if err := json.Unmarshal([]byte(text), &result); err != nil {
		slog.Error("parseArticleJSON: gagal parse", "error", err, "raw_length", len(raw), "snippet", text[:min(200, len(text))])
		return nil, fmt.Errorf("parsing AI article JSON: %w", err)
	}
	return &result, nil
}

// --- Provider implementations ---

func (b *ArticleBot) callClaude(aiModel, apiKey, systemPrompt, userPrompt string) (*model.AIGenerateResponse, error) {
	body := map[string]interface{}{
		"model":      aiModel,
		"max_tokens": 4096,
		"messages":   []map[string]string{{"role": "user", "content": userPrompt}},
		"system":     systemPrompt,
	}

	respBody, err := b.httpPost("https://api.anthropic.com/v1/messages", apiKey, body, map[string]string{
		"x-api-key":         apiKey,
		"anthropic-version":  "2023-06-01",
	})
	if err != nil {
		return nil, err
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

	return b.parseArticleJSON([]byte(claudeResp.Content[0].Text))
}

func (b *ArticleBot) callOpenAICompat(baseURL, aiModel, apiKey, systemPrompt, userPrompt string) (*model.AIGenerateResponse, error) {
	body := map[string]interface{}{
		"model":      aiModel,
		"max_tokens": 4096,
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
	}

	respBody, err := b.httpPost(baseURL, apiKey, body, map[string]string{
		"Authorization": "Bearer " + apiKey,
	})
	if err != nil {
		return nil, err
	}

	var openaiResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBody, &openaiResp); err != nil {
		return nil, fmt.Errorf("parsing OpenAI response: %w", err)
	}
	if len(openaiResp.Choices) == 0 {
		return nil, fmt.Errorf("empty response from OpenAI")
	}

	return b.parseArticleJSON([]byte(openaiResp.Choices[0].Message.Content))
}

func (b *ArticleBot) callGemini(aiModel, apiKey, systemPrompt, userPrompt string) (*model.AIGenerateResponse, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", aiModel, apiKey)

	body := map[string]interface{}{
		"system_instruction": map[string]interface{}{
			"parts": []map[string]string{{"text": systemPrompt}},
		},
		"contents": []map[string]interface{}{
			{"parts": []map[string]string{{"text": userPrompt}}},
		},
		"generationConfig": map[string]interface{}{
			"maxOutputTokens": 4096,
		},
	}

	respBody, err := b.httpPost(url, "", body, nil)
	if err != nil {
		return nil, err
	}

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return nil, fmt.Errorf("parsing Gemini response: %w", err)
	}
	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty response from Gemini")
	}

	return b.parseArticleJSON([]byte(geminiResp.Candidates[0].Content.Parts[0].Text))
}

// GenerateFromRequest generates an article from explicit user params and returns the result (no auto-save).
func (b *ArticleBot) GenerateFromRequest(ctx context.Context, req model.AIGenerateRequest, provider, aiModel string) (*model.AIGenerateResponse, error) {
	// Load API key from DB (by provider), fallback to env
	apiKey := ""
	if dbKey, err := b.apiKeyRepo.FindActiveByProvider(ctx, provider); err == nil && dbKey != nil {
		apiKey = dbKey.KeyValue
	}
	if apiKey == "" {
		apiKey = b.cfg.APIKey
	}
	if apiKey == "" {
		return nil, fmt.Errorf("API key belum dikonfigurasi untuk provider %q (env atau DB)", provider)
	}

	result, err := b.callAI(provider, aiModel, apiKey, req)
	if err != nil {
		return nil, fmt.Errorf("gagal generate artikel via %s: %w", provider, err)
	}
	return result, nil
}

func (b *ArticleBot) httpPost(url, _ string, body interface{}, headers map[string]string) ([]byte, error) {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshaling request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(context.Background(), "POST", url, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		httpReq.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		bodyStr := string(respBody)
		slog.Error("AI API error", "status", resp.StatusCode, "body", bodyStr)
		return nil, fmt.Errorf("AI API status %d: %s", resp.StatusCode, bodyStr)
	}

	return respBody, nil
}
