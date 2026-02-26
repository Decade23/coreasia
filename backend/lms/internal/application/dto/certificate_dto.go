package dto

import "time"

type CertificateResponse struct {
	ID                string    `json:"id"`
	CertificateNumber string    `json:"certificate_number"`
	AssesseeID        string    `json:"assessee_id"`
	SchemeID          string    `json:"scheme_id"`
	TemplateID        *string   `json:"template_id"`
	AssessorID        *string   `json:"assessor_id"`
	Status            string    `json:"status"`
	IssuedDate        time.Time `json:"issued_date"`
	ExpiryDate        time.Time `json:"expiry_date"`
	DownloadURL       *string   `json:"download_url"`
	QRCodeData        *string   `json:"qr_code_data"`
	CreatedAt         time.Time `json:"created_at"`
}

type CertificateVerifyResponse struct {
	Valid             bool      `json:"valid"`
	CertificateNumber string    `json:"certificate_number"`
	HolderName        string    `json:"holder_name"`
	SchemeName        string    `json:"scheme_name"`
	IssuedDate        time.Time `json:"issued_date"`
	ExpiryDate        time.Time `json:"expiry_date"`
	Status            string    `json:"status"`
	TenantName        string    `json:"tenant_name"`
}

type CreateTemplateRequest struct {
	Name        string                      `json:"name" validate:"required,min=2,max=200"`
	Description *string                     `json:"description,omitempty"`
	SchemeID    *string                     `json:"scheme_id,omitempty" validate:"omitempty,uuid"`
	IsDefault   bool                        `json:"is_default"`
	Fields      []CreateTemplateFieldRequest `json:"fields,omitempty"`
}

type CreateTemplateFieldRequest struct {
	FieldKey  string  `json:"field_key" validate:"required"`
	Label     string  `json:"label" validate:"required"`
	FieldType string  `json:"field_type" validate:"required,oneof=text date image qr_code"`
	PositionX float64 `json:"position_x"`
	PositionY float64 `json:"position_y"`
	FontSize  int     `json:"font_size" validate:"min=6,max=72"`
	SortOrder int     `json:"sort_order"`
}

type TemplateResponse struct {
	ID           string                  `json:"id"`
	Name         string                  `json:"name"`
	Description  *string                 `json:"description"`
	SchemeID     *string                 `json:"scheme_id"`
	ThumbnailURL *string                 `json:"thumbnail_url"`
	IsDefault    bool                    `json:"is_default"`
	CreatedAt    time.Time               `json:"created_at"`
	UpdatedAt    time.Time               `json:"updated_at"`
	Fields       []TemplateFieldResponse `json:"fields,omitempty"`
}

type TemplateFieldResponse struct {
	ID        string  `json:"id"`
	FieldKey  string  `json:"field_key"`
	Label     string  `json:"label"`
	FieldType string  `json:"field_type"`
	PositionX float64 `json:"position_x"`
	PositionY float64 `json:"position_y"`
	FontSize  int     `json:"font_size"`
	SortOrder int     `json:"sort_order"`
}
