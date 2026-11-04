package auth

import (
	"context"
	"time"

	"github.com/google/uuid"
)

const TrustedDeviceTTL = 7 * 24 * time.Hour

// Identitas perangkat di JWT ditandatangani server. Nama hanya label tampilan,
// bukan sidik jari atau bukti autentikasi. Setiap pemakaian diperiksa ke DB.
type TrustedDevice struct {
	ID           uuid.UUID `json:"id"`
	AdminID      uuid.UUID `json:"-"`
	TokenVersion int       `json:"-"`
	Name         string    `json:"name"`
	CreatedAt    time.Time `json:"created_at"`
	LastUsedAt   time.Time `json:"last_used_at"`
	ExpiresAt    time.Time `json:"expires_at"`
	Current      bool      `json:"current"`
}

type TrustedDeviceStore interface {
	Create(context.Context, *TrustedDevice) (bool, error)
	Active(context.Context, uuid.UUID, uuid.UUID, int, time.Time) (bool, error)
	Renew(context.Context, uuid.UUID, uuid.UUID, int, time.Time, time.Time) (bool, error)
	List(context.Context, uuid.UUID, int, time.Time) ([]TrustedDevice, error)
	Revoke(context.Context, uuid.UUID, uuid.UUID, time.Time) (bool, error)
}
