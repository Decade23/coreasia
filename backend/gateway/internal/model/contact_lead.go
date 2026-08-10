package model

import (
	"time"

	"github.com/google/uuid"
)

const ContactLeadStatusNew = "new"

// BudgetRange* adalah kunci stabil rentang anggaran yang dipilih pengirim.
// Kunci disimpan apa adanya di database; labelnya dirender frontend supaya
// teksnya bisa diubah, dan diterjemahkan, tanpa menyentuh data lama.
const (
	BudgetRangeUnder5    = "under_5jt"
	BudgetRange5To10     = "5_10jt"
	BudgetRange10To25    = "10_25jt"
	BudgetRange25To50    = "25_50jt"
	BudgetRangeAbove50   = "above_50jt"
	BudgetRangeUndecided = "not_set"
)

// BudgetRangeLabels dipakai email notifikasi supaya tim sales membaca rentang
// yang bisa dimengerti, bukan kunci mentah.
var BudgetRangeLabels = map[string]string{
	BudgetRangeUnder5:    "Di bawah Rp5 juta",
	BudgetRange5To10:     "Rp5 juta sampai Rp10 juta",
	BudgetRange10To25:    "Rp10 juta sampai Rp25 juta",
	BudgetRange25To50:    "Rp25 juta sampai Rp50 juta",
	BudgetRangeAbove50:   "Di atas Rp50 juta",
	BudgetRangeUndecided: "Belum ada anggaran",
}

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

	// BudgetRange sengaja opsional. Pada kampanye berbayar bervolume kecil,
	// setiap kolom wajib tambahan menukar lead nyata dengan kerapian data.
	// Daftar nilainya ditegakkan di sini, bukan lewat CHECK di database, supaya
	// aturan dan kodenya selalu ter-deploy bersamaan.
	BudgetRange string `json:"budget_range" validate:"omitempty,oneof=under_5jt 5_10jt 10_25jt 25_50jt above_50jt not_set"`

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
	BudgetRange *string   `json:"budget_range,omitempty"`
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
