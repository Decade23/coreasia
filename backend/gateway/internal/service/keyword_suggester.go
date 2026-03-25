package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/model"
)

// KeywordSuggester uses AI to suggest SEO keywords.
type KeywordSuggester struct {
	httpClient *http.Client
}

func NewKeywordSuggester() *KeywordSuggester {
	return &KeywordSuggester{
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}
}

// SuggestKeywords calls AI to generate keyword suggestions.
func (s *KeywordSuggester) SuggestKeywords(req model.AIKeywordSuggestRequest, provider, aiModel, apiKey string) (*model.AIKeywordSuggestResponse, error) {
	systemPrompt := `Kamu adalah ahli SEO Indonesia dengan pengalaman riset keyword.
Tugasmu adalah menyarankan keyword SEO dalam bahasa Indonesia yang potensial untuk mendatangkan traffic organik.
Fokus pada long-tail keyword yang relevan dengan niche yang diberikan.
Berikan estimasi search volume dan difficulty berdasarkan pengetahuanmu.`

	category := req.Category
	if category == "" {
		category = "sesuai niche"
	}

	userPrompt := fmt.Sprintf(`Sarankan %d keyword SEO dalam bahasa Indonesia untuk niche: "%s"
Kategori target: %s

Berikan respons dalam format JSON array:
{
  "suggestions": [
    {
      "keyword": "keyword text",
      "category": "seo|teknologi|bisnis|marketing|edukasi|general",
      "search_volume_estimate": 1000,
      "difficulty_estimate": 45,
      "rationale": "alasan singkat kenapa keyword ini potensial"
    }
  ]
}

Pastikan:
- Keyword relevan dengan niche yang diberikan
- Gunakan bahasa Indonesia
- Mix antara keyword bervolume tinggi dan long-tail
- Estimasi search volume dan difficulty yang realistis (0-100 untuk difficulty)
- Rationale singkat dalam bahasa Indonesia`, req.Count, req.Niche, category)

	var rawResp string
	var err error

	switch strings.ToLower(provider) {
	case "claude", "anthropic":
		rawResp, err = s.callClaude(aiModel, apiKey, systemPrompt, userPrompt)
	case "openai":
		rawResp, err = s.callOpenAICompat("https://api.openai.com/v1/chat/completions", aiModel, apiKey, systemPrompt, userPrompt)
	case "groq":
		rawResp, err = s.callOpenAICompat("https://api.groq.com/openai/v1/chat/completions", aiModel, apiKey, systemPrompt, userPrompt)
	case "gemini":
		rawResp, err = s.callGemini(aiModel, apiKey, systemPrompt, userPrompt)
	default:
		return nil, fmt.Errorf("provider %q tidak didukung", provider)
	}

	if err != nil {
		return nil, err
	}

	// Parse JSON response
	cleaned := cleanJSONResponse(rawResp)
	var result model.AIKeywordSuggestResponse
	if err := json.Unmarshal([]byte(cleaned), &result); err != nil {
		return nil, fmt.Errorf("parsing keyword suggestions JSON: %w", err)
	}

	return &result, nil
}

// cleanJSONResponse strips markdown code fences and extracts JSON.
func cleanJSONResponse(raw string) string {
	s := strings.TrimSpace(raw)
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	s = strings.TrimSpace(s)

	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start >= 0 && end > start {
		return s[start : end+1]
	}
	return s
}

func (s *KeywordSuggester) callClaude(aiModel, apiKey, systemPrompt, userPrompt string) (string, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"model":      aiModel,
		"max_tokens": 4096,
		"system":     systemPrompt,
		"messages":   []map[string]string{{"role": "user", "content": userPrompt}},
	})
	req, _ := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("claude request error: %w", err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("claude error status %d: %s", resp.StatusCode, string(data))
	}

	var result struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.Unmarshal(data, &result); err != nil || len(result.Content) == 0 {
		return "", fmt.Errorf("claude empty response")
	}
	return result.Content[0].Text, nil
}

func (s *KeywordSuggester) callOpenAICompat(baseURL, aiModel, apiKey, systemPrompt, userPrompt string) (string, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"model": aiModel,
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"temperature": 0.7,
		"max_tokens":  4096,
	})
	req, _ := http.NewRequest("POST", baseURL, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("openai-compat request error: %w", err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("openai-compat error status %d: %s", resp.StatusCode, string(data))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(data, &result); err != nil || len(result.Choices) == 0 {
		return "", fmt.Errorf("openai-compat empty response")
	}
	return result.Choices[0].Message.Content, nil
}

func (s *KeywordSuggester) callGemini(aiModel, apiKey, systemPrompt, userPrompt string) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", aiModel, apiKey)
	body, _ := json.Marshal(map[string]interface{}{
		"system_instruction": map[string]interface{}{
			"parts": []map[string]string{{"text": systemPrompt}},
		},
		"contents": []map[string]interface{}{
			{"parts": []map[string]string{{"text": userPrompt}}},
		},
		"generationConfig": map[string]interface{}{
			"temperature": 0.7,
			"maxOutputTokens": 4096,
		},
	})
	req, _ := http.NewRequest("POST", url, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("gemini request error: %w", err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("gemini error status %d: %s", resp.StatusCode, string(data))
	}

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(data, &result); err != nil || len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini empty response")
	}
	return result.Candidates[0].Content.Parts[0].Text, nil
}
