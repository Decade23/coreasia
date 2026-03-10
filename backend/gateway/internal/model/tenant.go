package model

import (
	"time"

	"github.com/google/uuid"
)

type Tenant struct {
	ID         uuid.UUID  `json:"id"`
	Name       string     `json:"name"`
	Slug       string     `json:"slug"`
	SchemaName string     `json:"schema_name"`
	Domain     *string    `json:"domain"`
	IsActive   bool       `json:"is_active"`
	PlanID     *uuid.UUID `json:"plan_id"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type TenantRegistration struct {
	ID               uuid.UUID  `json:"id"`
	TenantID         *uuid.UUID `json:"tenant_id"`
	OrgName          string     `json:"org_name"`
	OrgType          string     `json:"org_type"`
	AdminEmail       string     `json:"admin_email"`
	AdminName        string     `json:"admin_name"`
	AdminPhone       *string    `json:"admin_phone"`
	PasswordHash     string     `json:"-"`
	PlanID           uuid.UUID  `json:"plan_id"`
	PaymentProvider  *string    `json:"payment_provider"`
	PaymentReference *string    `json:"payment_reference"`
	PaymentCheckout  *string    `json:"payment_checkout_url"`
	PaymentStatus    string     `json:"payment_status"`
	PaymentMethod    *string    `json:"payment_method"`
	PaidAt           *time.Time `json:"paid_at"`
	Amount           float64    `json:"amount"`
	ProvisionStatus  string     `json:"provision_status"`
	ProvisionedAt    *time.Time `json:"provisioned_at"`
	IsTrial          bool       `json:"is_trial"`
	TrialEndsAt      *time.Time `json:"trial_ends_at"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}
