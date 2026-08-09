package model

import (
	"time"

	"github.com/google/uuid"
)

const ContactLeadStatusNew = "new"

// CreateContactLeadRequest is the public contact form payload. Attribution
// values are captured at submission time so a later qualified lead or sale can
// be connected back to its originating campaign.
type CreateContactLeadRequest struct {
	Name    string `json:"name" validate:"required,min=2,max=200"`
	Email   string `json:"email" validate:"required,email,max=254"`
	Phone   string `json:"phone" validate:"omitempty,min=8,max=32"`
	Subject string `json:"subject" validate:"required,max=100"`
	Message string `json:"message" validate:"required,max=5000"`
	Consent bool   `json:"consent" validate:"required"`

	UTMSource   string `json:"utm_source" validate:"omitempty,max=255"`
	UTMMedium   string `json:"utm_medium" validate:"omitempty,max=255"`
	UTMCampaign string `json:"utm_campaign" validate:"omitempty,max=255"`
	UTMContent  string `json:"utm_content" validate:"omitempty,max=255"`
	UTMTerm     string `json:"utm_term" validate:"omitempty,max=255"`
	GCLID       string `json:"gclid" validate:"omitempty,max=512"`
	FBCLID      string `json:"fbclid" validate:"omitempty,max=512"`
	LandingPage string `json:"landing_page" validate:"omitempty,max=2048"`
	Referrer    string `json:"referrer" validate:"omitempty,max=2048"`
}

type ContactLead struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Email       string    `json:"email"`
	Phone       *string   `json:"phone,omitempty"`
	Subject     string    `json:"subject"`
	Message     string    `json:"message"`
	Consent     bool      `json:"consent"`
	ConsentedAt time.Time `json:"consented_at"`
	Status      string    `json:"status"`
	UTMSource   *string   `json:"utm_source,omitempty"`
	UTMMedium   *string   `json:"utm_medium,omitempty"`
	UTMCampaign *string   `json:"utm_campaign,omitempty"`
	UTMContent  *string   `json:"utm_content,omitempty"`
	UTMTerm     *string   `json:"utm_term,omitempty"`
	GCLID       *string   `json:"gclid,omitempty"`
	FBCLID      *string   `json:"fbclid,omitempty"`
	LandingPage *string   `json:"landing_page,omitempty"`
	Referrer    *string   `json:"referrer,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ContactLeadCreatedResponse intentionally stays flat to keep the public form
// contract small and stable.
type ContactLeadCreatedResponse struct {
	Success bool      `json:"success"`
	LeadID  uuid.UUID `json:"lead_id"`
	Status  string    `json:"status"`
}
