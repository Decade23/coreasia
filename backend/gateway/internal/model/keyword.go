package model

import (
	"time"

	"github.com/google/uuid"
)

type Keyword struct {
	ID           uuid.UUID  `json:"id"`
	Keyword      string     `json:"keyword"`
	Category     string     `json:"category"`
	SearchVolume *int       `json:"search_volume"`
	Difficulty   *int       `json:"difficulty"`
	Priority     int        `json:"priority"`
	Status       string     `json:"status"`
	Source       string     `json:"source"`
	UsageCount   int        `json:"usage_count"`
	LastUsedAt   *time.Time `json:"last_used_at"`
	CreatedBy    *uuid.UUID `json:"created_by"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type CreateKeywordRequest struct {
	Keyword      string `json:"keyword" validate:"required,min=2,max=200"`
	Category     string `json:"category" validate:"required,min=2,max=100"`
	SearchVolume *int   `json:"search_volume" validate:"omitempty,min=0"`
	Difficulty   *int   `json:"difficulty" validate:"omitempty,min=0,max=100"`
	Priority     int    `json:"priority" validate:"required,min=1,max=10"`
}

type UpdateKeywordRequest struct {
	Keyword      *string `json:"keyword" validate:"omitempty,min=2,max=200"`
	Category     *string `json:"category" validate:"omitempty,min=2,max=100"`
	SearchVolume *int    `json:"search_volume" validate:"omitempty,min=0"`
	Difficulty   *int    `json:"difficulty" validate:"omitempty,min=0,max=100"`
	Priority     *int    `json:"priority" validate:"omitempty,min=1,max=10"`
	Status       *string `json:"status" validate:"omitempty,oneof=active used paused"`
}

type KeywordListFilter struct {
	Page    int    `json:"page"`
	PerPage int    `json:"per_page"`
	Status  string `json:"status"`
	Category string `json:"category"`
	Search  string `json:"search"`
	SortBy  string `json:"sort_by"`
}

type KeywordStats struct {
	Total      int            `json:"total"`
	Active     int            `json:"active"`
	Used       int            `json:"used"`
	Paused     int            `json:"paused"`
	ByCategory map[string]int `json:"by_category"`
}

type AIKeywordSuggestRequest struct {
	Niche    string `json:"niche" validate:"required,min=5"`
	Category string `json:"category"`
	Count    int    `json:"count" validate:"required,min=1,max=30"`
}

type KeywordSuggestion struct {
	Keyword              string `json:"keyword"`
	Category             string `json:"category"`
	SearchVolumeEstimate int    `json:"search_volume_estimate"`
	DifficultyEstimate   int    `json:"difficulty_estimate"`
	Rationale            string `json:"rationale"`
}

type AIKeywordSuggestResponse struct {
	Suggestions []KeywordSuggestion `json:"suggestions"`
}
