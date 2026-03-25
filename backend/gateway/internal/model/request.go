package model

import "github.com/google/uuid"

// RegisterRequest represents the onboarding registration payload.
type RegisterRequest struct {
	OrgName    string    `json:"org_name" validate:"required,min=3,max=200"`
	Slug       string    `json:"slug" validate:"required,min=3,max=50,alphanum"`
	OrgType    string    `json:"org_type" validate:"required,oneof=lsp training_center corporate"`
	AdminName  string    `json:"admin_name" validate:"required,min=2,max=200"`
	AdminEmail string    `json:"admin_email" validate:"required,email"`
	AdminPhone string    `json:"admin_phone" validate:"omitempty,min=10,max=20"`
	Password   string    `json:"password" validate:"required,password_strength,max=100"`
	PlanID     uuid.UUID `json:"plan_id" validate:"required,uuid"`
}

// RegisterResponse is returned after a successful registration.
type RegisterResponse struct {
	RegistrationID uuid.UUID `json:"registration_id"`
	Status         string    `json:"status"`
	LoginURL       *string   `json:"login_url,omitempty"`
	InvoiceURL     *string   `json:"invoice_url,omitempty"`
}

// SlugCheckResponse is the response for slug availability check.
type SlugCheckResponse struct {
	Slug      string `json:"slug"`
	Available bool   `json:"available"`
}

// RegistrationStatusResponse is the response for checking registration status.
type RegistrationStatusResponse struct {
	RegistrationID  uuid.UUID `json:"registration_id"`
	Status          string    `json:"status"`
	PaymentStatus   string    `json:"payment_status"`
	ProvisionStatus string    `json:"provision_status"`
	LoginURL        *string   `json:"login_url,omitempty"`
	InvoiceURL      *string   `json:"invoice_url,omitempty"`
}
