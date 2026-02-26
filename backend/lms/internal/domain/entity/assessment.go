package entity

import (
	"time"

	"github.com/google/uuid"
)

type Assessment struct {
	ID             uuid.UUID          `json:"id"`
	AssesseeID     uuid.UUID          `json:"assessee_id"`
	AssessorID     uuid.UUID          `json:"assessor_id"`
	SchemeID       uuid.UUID          `json:"scheme_id"`
	ScheduleID     *uuid.UUID         `json:"schedule_id"`
	Recommendation *string            `json:"recommendation"`
	AssessorNotes  *string            `json:"assessor_notes"`
	Status         string             `json:"status"`
	SubmittedAt    *time.Time         `json:"submitted_at"`
	CreatedAt      time.Time          `json:"created_at"`
	Results        []AssessmentResult `json:"results,omitempty"`
}

type AssessmentResult struct {
	ID           uuid.UUID  `json:"id"`
	AssessmentID uuid.UUID  `json:"assessment_id"`
	CriteriaID   uuid.UUID  `json:"criteria_id"`
	Status       string     `json:"status"`
	EvidenceID   *uuid.UUID `json:"evidence_id"`
	Notes        *string    `json:"notes"`
}
