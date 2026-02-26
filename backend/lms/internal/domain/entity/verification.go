package entity

import (
	"time"

	"github.com/google/uuid"
)

type Verification struct {
	ID           uuid.UUID              `json:"id"`
	AssesseeID   uuid.UUID              `json:"assessee_id"`
	SchemeID     uuid.UUID              `json:"scheme_id"`
	Status       string                 `json:"status"`
	PersonalData []byte                 `json:"personal_data"`
	ReviewNotes  *string                `json:"review_notes"`
	ReviewedBy   *uuid.UUID             `json:"reviewed_by"`
	SubmittedAt  *time.Time             `json:"submitted_at"`
	ReviewedAt   *time.Time             `json:"reviewed_at"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
	Documents    []VerificationDocument `json:"documents,omitempty"`
	Assessee     *User                  `json:"assessee,omitempty"`
	Scheme       *Scheme                `json:"scheme,omitempty"`
}

type VerificationDocument struct {
	ID             uuid.UUID `json:"id"`
	VerificationID uuid.UUID `json:"verification_id"`
	Name           string    `json:"name"`
	DocumentType   string    `json:"document_type"`
	FileURL        string    `json:"file_url"`
	FileSize       int64     `json:"file_size"`
	UploadedAt     time.Time `json:"uploaded_at"`
}
