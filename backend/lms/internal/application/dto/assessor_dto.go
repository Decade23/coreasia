package dto

import "time"

type CreateAssessorRequest struct {
	Email           string   `json:"email" validate:"required,email"`
	FullName        string   `json:"full_name" validate:"required,min=2,max=200"`
	PhoneNumber     *string  `json:"phone_number,omitempty"`
	Password        string   `json:"password" validate:"required,min=6"`
	Specialization  *string  `json:"specialization,omitempty"`
	LicenseNumber   *string  `json:"license_number,omitempty"`
	LicenseIssuedBy *string  `json:"license_issued_by,omitempty"`
	LicenseIssuedAt *string  `json:"license_issued_at,omitempty"`
	LicenseExpiryAt *string  `json:"license_expiry_at,omitempty"`
	SchemeIDs       []string `json:"scheme_ids,omitempty"`
}

type UpdateAssessorRequest struct {
	FullName        *string  `json:"full_name,omitempty" validate:"omitempty,min=2,max=200"`
	PhoneNumber     *string  `json:"phone_number,omitempty"`
	Specialization  *string  `json:"specialization,omitempty"`
	LicenseNumber   *string  `json:"license_number,omitempty"`
	LicenseIssuedBy *string  `json:"license_issued_by,omitempty"`
	LicenseIssuedAt *string  `json:"license_issued_at,omitempty"`
	LicenseExpiryAt *string  `json:"license_expiry_at,omitempty"`
	LicenseStatus   *string  `json:"license_status,omitempty" validate:"omitempty,oneof=active expired pending_renewal"`
	SchemeIDs       []string `json:"scheme_ids,omitempty"`
}

type AssessorResponse struct {
	UserID          string           `json:"user_id"`
	Email           string           `json:"email"`
	FullName        string           `json:"full_name"`
	PhoneNumber     *string          `json:"phone_number"`
	Specialization  *string          `json:"specialization"`
	LicenseNumber   *string          `json:"license_number"`
	LicenseIssuedBy *string          `json:"license_issued_by"`
	LicenseIssuedAt *time.Time       `json:"license_issued_at"`
	LicenseExpiryAt *time.Time       `json:"license_expiry_at"`
	LicenseStatus   string           `json:"license_status"`
	Schemes         []SchemeResponse `json:"schemes,omitempty"`
}
