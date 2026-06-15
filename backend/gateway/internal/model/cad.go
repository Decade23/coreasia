package model

import (
	"time"

	"github.com/google/uuid"
)

// ───────────────────────── License ─────────────────────────

type CADLicense struct {
	ID          uuid.UUID  `json:"id"`
	LicenseKey  string     `json:"license_key"`
	Email       *string    `json:"email"`
	Tier        string     `json:"tier"`
	Status      string     `json:"status"`
	OrderRef    *string    `json:"order_ref"`
	DeviceLimit int        `json:"device_limit"`
	ExpiresAt   *time.Time `json:"expires_at"`
	Notes       *string    `json:"notes"`
	CreatedBy   *uuid.UUID `json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// DeviceCount is query-computed (active installations), not a DB column.
	DeviceCount int `json:"device_count"`
}

// CADLicenseResponse masks the (long) license key; full value via copy endpoint.
type CADLicenseResponse struct {
	ID          uuid.UUID  `json:"id"`
	KeyMasked   string     `json:"key_masked"`
	Email       *string    `json:"email"`
	Tier        string     `json:"tier"`
	Status      string     `json:"status"`
	OrderRef    *string    `json:"order_ref"`
	DeviceLimit int        `json:"device_limit"`
	DeviceCount int        `json:"device_count"`
	ExpiresAt   *time.Time `json:"expires_at"`
	Notes       *string    `json:"notes"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (l *CADLicense) ToResponse() CADLicenseResponse {
	return CADLicenseResponse{
		ID:          l.ID,
		KeyMasked:   maskKey(l.LicenseKey),
		Email:       l.Email,
		Tier:        l.Tier,
		Status:      l.Status,
		OrderRef:    l.OrderRef,
		DeviceLimit: l.DeviceLimit,
		DeviceCount: l.DeviceCount,
		ExpiresAt:   l.ExpiresAt,
		Notes:       l.Notes,
		CreatedAt:   l.CreatedAt,
		UpdatedAt:   l.UpdatedAt,
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

// CADActivateRequest is sent by the CAD app to bind a device to a license (online activation, future phase).
type CADActivateRequest struct {
	LicenseKey string  `json:"license_key" validate:"required"`
	DeviceHash string  `json:"device_hash" validate:"required"`
	AppVersion *string `json:"app_version"`
	OSVersion  *string `json:"os_version"`
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
