package entity

import (
	"time"

	"github.com/google/uuid"
)

type AssessorProfile struct {
	UserID          uuid.UUID  `json:"user_id"`
	Specialization  *string    `json:"specialization"`
	LicenseNumber   *string    `json:"license_number"`
	LicenseIssuedBy *string    `json:"license_issued_by"`
	LicenseIssuedAt *time.Time `json:"license_issued_at"`
	LicenseExpiryAt *time.Time `json:"license_expiry_at"`
	LicenseStatus   string     `json:"license_status"`
	User            *User      `json:"user,omitempty"`
	Schemes         []Scheme   `json:"schemes,omitempty"`
}
