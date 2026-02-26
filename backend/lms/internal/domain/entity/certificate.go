package entity

import (
	"time"

	"github.com/google/uuid"
)

type Certificate struct {
	ID                uuid.UUID  `json:"id"`
	CertificateNumber string     `json:"certificate_number"`
	AssesseeID        uuid.UUID  `json:"assessee_id"`
	SchemeID          uuid.UUID  `json:"scheme_id"`
	TemplateID        *uuid.UUID `json:"template_id"`
	AssessorID        *uuid.UUID `json:"assessor_id"`
	Status            string     `json:"status"`
	IssuedDate        time.Time  `json:"issued_date"`
	ExpiryDate        time.Time  `json:"expiry_date"`
	DownloadURL       *string    `json:"download_url"`
	QRCodeData        *string    `json:"qr_code_data"`
	CreatedAt         time.Time  `json:"created_at"`
}

type CertificateTemplate struct {
	ID           uuid.UUID                  `json:"id"`
	Name         string                     `json:"name"`
	Description  *string                    `json:"description"`
	SchemeID     *uuid.UUID                 `json:"scheme_id"`
	ThumbnailURL *string                    `json:"thumbnail_url"`
	IsDefault    bool                       `json:"is_default"`
	CreatedAt    time.Time                  `json:"created_at"`
	UpdatedAt    time.Time                  `json:"updated_at"`
	Fields       []CertificateTemplateField `json:"fields,omitempty"`
}

type CertificateTemplateField struct {
	ID         uuid.UUID `json:"id"`
	TemplateID uuid.UUID `json:"template_id"`
	FieldKey   string    `json:"field_key"`
	Label      string    `json:"label"`
	FieldType  string    `json:"field_type"`
	PositionX  float64   `json:"position_x"`
	PositionY  float64   `json:"position_y"`
	FontSize   int       `json:"font_size"`
	SortOrder  int       `json:"sort_order"`
}
