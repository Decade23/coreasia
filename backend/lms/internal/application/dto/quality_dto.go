package dto

import "time"

type QualityStatsResponse struct {
	TotalAssessments  int                     `json:"total_assessments"`
	CompetentCount    int                     `json:"competent_count"`
	NotCompetentCount int                     `json:"not_competent_count"`
	PassRate          float64                 `json:"pass_rate"`
	PendingReviews    int                     `json:"pending_reviews"`
	SchemeBreakdown   []SchemeBreakdownItem   `json:"scheme_breakdown"`
}

type SchemeBreakdownItem struct {
	SchemeName string  `json:"scheme_name"`
	Total      int     `json:"total"`
	Competent  int     `json:"competent"`
	PassRate   float64 `json:"pass_rate"`
}

type QualityReviewResponse struct {
	ID             string     `json:"id"`
	AssesseeID     string     `json:"assessee_id"`
	AssesseeName   string     `json:"assessee_name"`
	AssessorID     string     `json:"assessor_id"`
	AssessorName   string     `json:"assessor_name"`
	SchemeID       string     `json:"scheme_id"`
	SchemeName     string     `json:"scheme_name"`
	Recommendation string     `json:"recommendation"`
	AssessorNotes  *string    `json:"assessor_notes"`
	ManagerNotes   *string    `json:"manager_notes"`
	Status         string     `json:"status"`
	SubmittedAt    time.Time  `json:"submitted_at"`
	ReviewedAt     *time.Time `json:"reviewed_at"`
}

type UpdateQualityReviewRequest struct {
	Status       string  `json:"status" validate:"required,oneof=approved rejected revision_needed"`
	ManagerNotes *string `json:"manager_notes,omitempty"`
}
