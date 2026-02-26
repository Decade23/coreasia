package dto

import "time"

type AssessmentUnitResponse struct {
	ID       string                      `json:"id"`
	Code     string                      `json:"code"`
	Title    string                      `json:"title"`
	Elements []AssessmentElementResponse `json:"elements"`
}

type AssessmentElementResponse struct {
	ID       string                       `json:"id"`
	Title    string                       `json:"title"`
	Criteria []AssessmentCriteriaResponse `json:"criteria"`
}

type AssessmentCriteriaResponse struct {
	ID     string  `json:"id"`
	Text   string  `json:"text"`
	Status *string `json:"status"`
}

type AssessmentResponse struct {
	ID             string                   `json:"id"`
	AssesseeID     string                   `json:"assessee_id"`
	AssessorID     string                   `json:"assessor_id"`
	SchemeID       string                   `json:"scheme_id"`
	Recommendation *string                  `json:"recommendation"`
	AssessorNotes  *string                  `json:"assessor_notes"`
	Status         string                   `json:"status"`
	SubmittedAt    *time.Time               `json:"submitted_at"`
	CreatedAt      time.Time                `json:"created_at"`
	Results        []AssessmentResultResponse `json:"results,omitempty"`
}

type AssessmentResultResponse struct {
	ID         string  `json:"id"`
	CriteriaID string  `json:"criteria_id"`
	Status     string  `json:"status"`
	EvidenceID *string `json:"evidence_id"`
}

type SubmitAssessmentRequest struct {
	Recommendation string                       `json:"recommendation" validate:"required,oneof=competent not_competent"`
	AssessorNotes  *string                      `json:"assessor_notes,omitempty"`
	Results        []SubmitAssessmentResultItem `json:"results" validate:"required,dive"`
}

type SubmitAssessmentResultItem struct {
	CriteriaID string  `json:"criteria_id" validate:"required,uuid"`
	Status     string  `json:"status" validate:"required,oneof=K BK"`
	EvidenceID *string `json:"evidence_id,omitempty" validate:"omitempty,uuid"`
}
