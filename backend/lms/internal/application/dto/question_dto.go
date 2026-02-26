package dto

import "time"

type CreateQuestionRequest struct {
	SchemeID     string                  `json:"scheme_id" validate:"required,uuid"`
	QuestionType string                 `json:"question_type" validate:"required,oneof=multiple_choice essay upload observation"`
	QuestionText string                 `json:"question_text" validate:"required"`
	Difficulty   string                 `json:"difficulty" validate:"required,oneof=easy medium hard"`
	Points       int                    `json:"points" validate:"required,min=1"`
	Rubric       *string                `json:"rubric,omitempty"`
	Instructions *string                `json:"instructions,omitempty"`
	Options      []CreateOptionRequest  `json:"options,omitempty"`
}

type UpdateQuestionRequest struct {
	QuestionType *string `json:"question_type,omitempty" validate:"omitempty,oneof=multiple_choice essay upload observation"`
	QuestionText *string `json:"question_text,omitempty"`
	Difficulty   *string `json:"difficulty,omitempty" validate:"omitempty,oneof=easy medium hard"`
	Points       *int    `json:"points,omitempty" validate:"omitempty,min=1"`
	IsActive     *bool   `json:"is_active,omitempty"`
	Rubric       *string `json:"rubric,omitempty"`
	Instructions *string `json:"instructions,omitempty"`
}

type CreateOptionRequest struct {
	Text      string `json:"text" validate:"required"`
	IsCorrect bool   `json:"is_correct"`
	SortOrder int    `json:"sort_order"`
}

type QuestionResponse struct {
	ID           string           `json:"id"`
	SchemeID     string           `json:"scheme_id"`
	QuestionType string           `json:"question_type"`
	QuestionText string           `json:"question_text"`
	Difficulty   string           `json:"difficulty"`
	Points       int              `json:"points"`
	IsActive     bool             `json:"is_active"`
	Rubric       *string          `json:"rubric"`
	Instructions *string          `json:"instructions"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	Options      []OptionResponse `json:"options,omitempty"`
}

type OptionResponse struct {
	ID        string `json:"id"`
	Text      string `json:"text"`
	IsCorrect bool   `json:"is_correct"`
	SortOrder int    `json:"sort_order"`
}
