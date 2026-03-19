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

// ArticleBot generates articles automatically using AI.
// It checks existing articles to avoid duplicates and picks topics
// relevant to CoreAsia's services.
type ArticleBot struct {
	cfg         config.AIConfig
	articleRepo *repository.ArticleRepo
	auditRepo   *repository.AuditLogRepo
	apiKeyRepo  *repository.APIKeyRepo
}

func NewArticleBot(cfg config.AIConfig, articleRepo *repository.ArticleRepo, auditRepo *repository.AuditLogRepo, apiKeyRepo *repository.APIKeyRepo) *ArticleBot {
	return &ArticleBot{cfg: cfg, articleRepo: articleRepo, auditRepo: auditRepo, apiKeyRepo: apiKeyRepo}
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

// Run picks a topic not yet written, generates the article, and saves it as draft.
func (b *ArticleBot) Run(ctx context.Context) error {
	// Load API key from DB first, fallback to env config
	apiKey := b.cfg.APIKey
	if dbKey, err := b.apiKeyRepo.FindActiveByProvider(ctx, "claude"); err == nil && dbKey != nil {
		apiKey = dbKey.KeyValue
	}
	if apiKey == "" {
		return fmt.Errorf("AI API key belum dikonfigurasi (env atau DB)")
	}
	b.cfg.APIKey = apiKey // use for callClaudeAPI

	// Fetch existing article titles to avoid duplicates
	existing, _, err := b.articleRepo.FindAll(ctx, model.ArticleListFilter{Page: 1, PerPage: 500})
	if err != nil {
		return fmt.Errorf("gagal fetch existing articles: %w", err)
	}

	existingTitles := make(map[string]bool)
	for _, a := range existing {
		existingTitles[strings.ToLower(a.Title)] = true
	}

	// Pick a random topic that doesn't exist yet
	topic, category := b.pickTopic(existingTitles)
	if topic == "" {
		slog.Info("article-bot: semua topik sudah ditulis, skip")
		return nil
	}

	slog.Info("article-bot: generating article", "topic", topic, "category", category)

	req := model.AIGenerateRequest{
		Topic:     topic,
		Keywords:  []string{category, "coreasia", "bisnis digital"},
		Tone:      "professional",
		Language:  "id",
		WordCount: 1200,
		Category:  category,
	}

	result, err := b.callClaudeAPI(req)
	if err != nil {
		return fmt.Errorf("gagal generate artikel: %w", err)
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

	desc := fmt.Sprintf("Bot auto-generated artikel: %s", article.Title)
	botName := "ArticleBot"
	articleID := article.ID.String()
	b.auditRepo.LogAction(ctx, nil, &botName, "ai_generate", "articles", &articleID, &desc, "system")

	slog.Info("article-bot: artikel berhasil dibuat", "title", article.Title, "id", article.ID)
	return nil
}

func (b *ArticleBot) pickTopic(existing map[string]bool) (string, string) {
	// Shuffle categories
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

func (b *ArticleBot) callClaudeAPI(req model.AIGenerateRequest) (*model.AIGenerateResponse, error) {
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

	body := map[string]interface{}{
		"model":      b.cfg.Model,
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

	httpReq, err := http.NewRequestWithContext(context.Background(), "POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", b.cfg.APIKey)
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
