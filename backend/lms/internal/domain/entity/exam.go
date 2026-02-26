package entity

import (
	"time"

	"github.com/google/uuid"
)

type Exam struct {
	ID          uuid.UUID    `json:"id"`
	AssesseeID  uuid.UUID    `json:"assessee_id"`
	ScheduleID  uuid.UUID    `json:"schedule_id"`
	SchemeID    uuid.UUID    `json:"scheme_id"`
	Status      string       `json:"status"`
	StartedAt   *time.Time   `json:"started_at"`
	SubmittedAt *time.Time   `json:"submitted_at"`
	Score       *float64     `json:"score"`
	CreatedAt   time.Time    `json:"created_at"`
	Answers     []ExamAnswer `json:"answers,omitempty"`
}

type ExamAnswer struct {
	ID               uuid.UUID  `json:"id"`
	ExamID           uuid.UUID  `json:"exam_id"`
	QuestionID       uuid.UUID  `json:"question_id"`
	AnswerText       *string    `json:"answer_text"`
	SelectedOptionID *uuid.UUID `json:"selected_option_id"`
	FileURL          *string    `json:"file_url"`
	PointsAwarded    *float64   `json:"points_awarded"`
	GradedBy         *uuid.UUID `json:"graded_by"`
	GradedAt         *time.Time `json:"graded_at"`
}
