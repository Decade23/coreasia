package entity

import (
	"time"

	"github.com/google/uuid"
)

type Question struct {
	ID           uuid.UUID        `json:"id"`
	SchemeID     uuid.UUID        `json:"scheme_id"`
	QuestionType string           `json:"question_type"`
	QuestionText string           `json:"question_text"`
	Difficulty   string           `json:"difficulty"`
	Points       int              `json:"points"`
	IsActive     bool             `json:"is_active"`
	Rubric       *string          `json:"rubric"`
	Instructions *string          `json:"instructions"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	Options      []QuestionOption `json:"options,omitempty"`
}

type QuestionOption struct {
	ID         uuid.UUID `json:"id"`
	QuestionID uuid.UUID `json:"question_id"`
	Text       string    `json:"text"`
	IsCorrect  bool      `json:"is_correct"`
	SortOrder  int       `json:"sort_order"`
}
