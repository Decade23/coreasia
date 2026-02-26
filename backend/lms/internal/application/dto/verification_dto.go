package dto

import "time"

type UpdateVerificationRequest struct {
	Status      string  `json:"status" validate:"required,oneof=UNDER_REVIEW REVISION_NEEDED VERIFIED REJECTED"`
	ReviewNotes *string `json:"review_notes,omitempty"`
}

type VerificationResponse struct {
	ID           string                     `json:"id"`
	AssesseeID   string                     `json:"assessee_id"`
	SchemeID     string                     `json:"scheme_id"`
	Status       string                     `json:"status"`
	PersonalData interface{}                `json:"personal_data"`
	ReviewNotes  *string                    `json:"review_notes"`
	ReviewedBy   *string                    `json:"reviewed_by"`
	SubmittedAt  *time.Time                 `json:"submitted_at"`
	ReviewedAt   *time.Time                 `json:"reviewed_at"`
	CreatedAt    time.Time                  `json:"created_at"`
	UpdatedAt    time.Time                  `json:"updated_at"`
	Documents    []VerificationDocResponse  `json:"documents,omitempty"`
	Assessee     *UserResponse              `json:"assessee,omitempty"`
}

type VerificationDocResponse struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	DocumentType string    `json:"document_type"`
	FileURL      string    `json:"file_url"`
	FileSize     int64     `json:"file_size"`
	UploadedAt   time.Time `json:"uploaded_at"`
}

type VerificationSummaryResponse struct {
	Draft          int `json:"draft"`
	Submitted      int `json:"submitted"`
	UnderReview    int `json:"under_review"`
	RevisionNeeded int `json:"revision_needed"`
	Verified       int `json:"verified"`
	Rejected       int `json:"rejected"`
	Total          int `json:"total"`
}
