package dto

import "time"

type ExamResponse struct {
	ID              string                 `json:"id"`
	SchemeID        string                 `json:"scheme_id"`
	Title           string                 `json:"title"`
	DurationMinutes int                    `json:"duration_minutes"`
	PassingScore    int                    `json:"passing_score"`
	Status          string                 `json:"status"`
	StartedAt       *time.Time             `json:"started_at"`
	SubmittedAt     *time.Time             `json:"submitted_at"`
	Score           *float64               `json:"score"`
	Questions       []ExamQuestionResponse `json:"questions,omitempty"`
}

type ExamQuestionResponse struct {
	ID           string               `json:"id"`
	QuestionType string               `json:"question_type"`
	QuestionText string               `json:"question_text"`
	Points       int                  `json:"points"`
	IsRequired   bool                 `json:"is_required"`
	Options      []ExamOptionResponse `json:"options,omitempty"`
}

type ExamOptionResponse struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Value string `json:"value"`
}

type SubmitExamRequest struct {
	ExamID        string            `json:"exam_id" validate:"required"`
	Answers       map[string]string `json:"answers" validate:"required"`
	RemainingTime int               `json:"remaining_time"`
}

type SubmitExamResponse struct {
	ExamID      string    `json:"exam_id"`
	SubmittedAt time.Time `json:"submitted_at"`
	Status      string    `json:"status"`
}

type SyncAnswersRequest struct {
	ExamID  string            `json:"exam_id" validate:"required"`
	Answers map[string]string `json:"answers" validate:"required"`
}

type SyncAnswersResponse struct {
	Success  bool      `json:"success"`
	SyncedAt time.Time `json:"synced_at"`
}
