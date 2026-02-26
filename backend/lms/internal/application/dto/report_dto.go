package dto

import "time"

type ReportSummaryResponse struct {
	TotalCertificatesIssued int    `json:"totalCertificatesIssued"`
	TotalAssessments        int    `json:"totalAssessments"`
	TotalAssessees          int    `json:"totalAssessees"`
	TotalSchemes            int    `json:"totalSchemes"`
	PeriodStart             string `json:"periodStart"`
	PeriodEnd               string `json:"periodEnd"`
}

type BnspExportRequest struct {
	Format      string  `json:"format" validate:"required,oneof=xlsx csv"`
	SchemeID    *string `json:"scheme_id,omitempty" validate:"omitempty,uuid"`
	PeriodStart string  `json:"period_start" validate:"required"`
	PeriodEnd   string  `json:"period_end" validate:"required"`
}

type BnspExportResponse struct {
	DownloadURL string    `json:"download_url"`
	FileName    string    `json:"file_name"`
	RecordCount int       `json:"record_count"`
	GeneratedAt time.Time `json:"generated_at"`
}
