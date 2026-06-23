package model

import (
	"time"

	"github.com/google/uuid"
)

// ───────────────────────── License ─────────────────────────

type CADLicense struct {
	ID             uuid.UUID  `json:"id"`
	LicenseKey     string     `json:"license_key"`
	Email          *string    `json:"email"`
	Tier           string     `json:"tier"`
	Status         string     `json:"status"`
	Platform       string     `json:"platform"`
	OrderRef       *string    `json:"order_ref"`
	DeviceLimit    int        `json:"device_limit"`
	LastTransferAt *time.Time `json:"last_transfer_at"`
	ExpiresAt      *time.Time `json:"expires_at"`
	Notes          *string    `json:"notes"`
	CreatedBy      *uuid.UUID `json:"created_by"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	// DeviceCount is query-computed (active installations), not a DB column.
	DeviceCount int `json:"device_count"`
}

// CADLicenseResponse masks the (long) license key; full value via copy endpoint.
type CADLicenseResponse struct {
	ID             uuid.UUID  `json:"id"`
	KeyMasked      string     `json:"key_masked"`
	Email          *string    `json:"email"`
	Tier           string     `json:"tier"`
	Status         string     `json:"status"`
	Platform       string     `json:"platform"`
	OrderRef       *string    `json:"order_ref"`
	DeviceLimit    int        `json:"device_limit"`
	DeviceCount    int        `json:"device_count"`
	LastTransferAt *time.Time `json:"last_transfer_at"`
	ExpiresAt      *time.Time `json:"expires_at"`
	Notes          *string    `json:"notes"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (l *CADLicense) ToResponse() CADLicenseResponse {
	return CADLicenseResponse{
		ID:             l.ID,
		KeyMasked:      maskKey(l.LicenseKey),
		Email:          l.Email,
		Tier:           l.Tier,
		Status:         l.Status,
		Platform:       l.Platform,
		OrderRef:       l.OrderRef,
		DeviceLimit:    l.DeviceLimit,
		DeviceCount:    l.DeviceCount,
		LastTransferAt: l.LastTransferAt,
		ExpiresAt:      l.ExpiresAt,
		Notes:          l.Notes,
		CreatedAt:      l.CreatedAt,
		UpdatedAt:      l.UpdatedAt,
	}
}

type CreateCADLicenseRequest struct {
	LicenseKey  string  `json:"license_key" validate:"required,min=8"`
	Email       *string `json:"email" validate:"omitempty,email"`
	Tier        string  `json:"tier"`
	OrderRef    *string `json:"order_ref"`
	DeviceLimit *int    `json:"device_limit"`
	Notes       *string `json:"notes"`
}

type UpdateCADLicenseRequest struct {
	Email       *string `json:"email" validate:"omitempty,email"`
	Tier        *string `json:"tier"`
	Status      *string `json:"status"`
	OrderRef    *string `json:"order_ref"`
	DeviceLimit *int    `json:"device_limit"`
	Notes       *string `json:"notes"`
}

// ImportCADLicensesRequest bulk-imports pre-generated keys (e.g. the offline batch).
type ImportCADLicensesRequest struct {
	Keys []string `json:"keys" validate:"required,min=1"`
	Tier string   `json:"tier"`
}

// GenerateCADLicenseRequest mints NEW signed keys server-side (admin "Generate").
type GenerateCADLicenseRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Tier        string `json:"tier"`
	Count       int    `json:"count" validate:"omitempty,min=1,max=100"`
	DeviceLimit *int   `json:"device_limit"`
	SendEmail   bool   `json:"send_email"` // email the key(s) to Email after generating
}

// ───────────────────────── Installation / device ─────────────────────────

type CADInstallation struct {
	ID         uuid.UUID  `json:"id"`
	LicenseID  *uuid.UUID `json:"license_id"`
	DeviceHash string     `json:"device_hash"`
	AppVersion *string    `json:"app_version"`
	OSVersion  *string    `json:"os_version"`
	Revoked    bool       `json:"revoked"`
	FirstSeen  time.Time  `json:"first_seen"`
	LastSeen   time.Time  `json:"last_seen"`
}

// ───────────────────────── App-facing (public) payloads ─────────────────────────

// CADActivateRequest is sent by the CAD app to bind a device to a license
// (device-locked online activation). Platform defaults to "macos" when empty.
type CADActivateRequest struct {
	LicenseKey string  `json:"license_key" validate:"required"`
	DeviceHash string  `json:"device_hash" validate:"required"`
	Platform   string  `json:"platform"`
	AppVersion *string `json:"app_version"`
	OSVersion  *string `json:"os_version"`
}

// CADDeactivateRequest is sent by the CAD app for self-service device transfer:
// the user releases the current device so they can activate on another one.
type CADDeactivateRequest struct {
	LicenseKey string `json:"license_key" validate:"required"`
	DeviceHash string `json:"device_hash" validate:"required"`
}

// CADTelemetryRequest is an anonymous, privacy-first event. NO URLs / download history ever.
type CADTelemetryRequest struct {
	InstallID  string  `json:"install_id" validate:"required"`
	EventType  string  `json:"event_type" validate:"required"`
	AppVersion *string `json:"app_version"`
	OSVersion  *string `json:"os_version"`
}

// ───────────────────────── Analytics aggregates (admin) ─────────────────────────

type CADCount struct {
	Label string `json:"label"`
	Count int64  `json:"count"`
}

type CADTimePoint struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type CADAnalyticsSummary struct {
	TotalLicenses  int64          `json:"total_licenses"`
	ActiveLicenses int64          `json:"active_licenses"`
	TotalDevices   int64          `json:"total_devices"`
	ActiveDevices  int64          `json:"active_devices"` // last 30 days
	ByVersion      []CADCount     `json:"by_version"`
	ByOS           []CADCount     `json:"by_os"`
	DailyActive    []CADTimePoint `json:"daily_active"` // last 14 days
}
