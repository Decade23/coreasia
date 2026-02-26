package entity

import (
	"time"

	"github.com/google/uuid"
)

type QualityReview struct {
	ID             uuid.UUID  `json:"id"`
	AssessmentID   uuid.UUID  `json:"assessment_id"`
	AssesseeID     uuid.UUID  `json:"assessee_id"`
	AssessorID     uuid.UUID  `json:"assessor_id"`
	SchemeID       uuid.UUID  `json:"scheme_id"`
	Recommendation string     `json:"recommendation"`
	AssessorNotes  *string    `json:"assessor_notes"`
	ManagerNotes   *string    `json:"manager_notes"`
	Status         string     `json:"status"`
	ReviewedBy     *uuid.UUID `json:"reviewed_by"`
	SubmittedAt    time.Time  `json:"submitted_at"`
	ReviewedAt     *time.Time `json:"reviewed_at"`
}
