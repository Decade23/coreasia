package repository

import (
	"context"
	"errors"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TrustedDeviceRepo struct{ pool adminUserDB }

func NewTrustedDeviceRepo(pool *pgxpool.Pool) *TrustedDeviceRepo {
	return &TrustedDeviceRepo{pool: pool}
}

// FOR SHARE menserialkan pendaftaran dengan perubahan sandi/peran/logout-all.
// Sesi versi lama tidak bisa membuat perangkat setelah pencabutan selesai.
func (r *TrustedDeviceRepo) Create(ctx context.Context, d *auth.TrustedDevice) (bool, error) {
	tag, err := r.pool.Exec(ctx, `WITH owner AS (
        SELECT id FROM public.admin_users WHERE id=$2 AND is_active AND token_version=$3
          AND totp_enabled_at IS NOT NULL AND totp_secret_enc IS NOT NULL FOR SHARE
    ) INSERT INTO public.admin_trusted_devices(id,admin_id,token_version,name,created_at,last_used_at,expires_at)
      SELECT $1,id,$3,$4,$5,$5,$6 FROM owner`, d.ID, d.AdminID, d.TokenVersion, d.Name, d.CreatedAt, d.ExpiresAt)
	return tag.RowsAffected() == 1, err
}

// ActiveUntil returns a zero time if the device or its owning session is no longer valid.
func (r *TrustedDeviceRepo) ActiveUntil(ctx context.Context, id, owner uuid.UUID, tv int, now time.Time) (time.Time, error) {
	var expiresAt time.Time
	err := r.pool.QueryRow(ctx, `SELECT d.expires_at FROM public.admin_trusted_devices d
      JOIN public.admin_users u ON u.id=d.admin_id
      WHERE d.id=$1 AND d.admin_id=$2 AND d.token_version=$3 AND d.revoked_at IS NULL AND d.expires_at>$4
        AND u.is_active AND u.token_version=$3 AND u.totp_enabled_at IS NOT NULL AND u.totp_secret_enc IS NOT NULL`, id, owner, tv, now).Scan(&expiresAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return time.Time{}, nil
	}
	return expiresAt, err
}
func (r *TrustedDeviceRepo) Renew(ctx context.Context, id, owner uuid.UUID, tv int, now, until time.Time) (bool, error) {
	tag, err := r.pool.Exec(ctx, `UPDATE public.admin_trusted_devices d SET last_used_at=GREATEST(last_used_at,$4),expires_at=GREATEST(expires_at,$5)
      FROM public.admin_users u WHERE d.id=$1 AND d.admin_id=$2 AND d.token_version=$3 AND d.revoked_at IS NULL
        AND d.expires_at>$4 AND u.id=d.admin_id AND u.is_active AND u.token_version=$3
        AND u.totp_enabled_at IS NOT NULL AND u.totp_secret_enc IS NOT NULL`, id, owner, tv, now, until)
	return tag.RowsAffected() == 1, err
}
func (r *TrustedDeviceRepo) List(ctx context.Context, owner uuid.UUID, tv int, now time.Time) ([]auth.TrustedDevice, error) {
	rows, err := r.pool.Query(ctx, `SELECT id,name,created_at,last_used_at,expires_at FROM public.admin_trusted_devices
      WHERE admin_id=$1 AND token_version=$2 AND revoked_at IS NULL AND expires_at>$3 ORDER BY last_used_at DESC,id`, owner, tv, now)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	devices := []auth.TrustedDevice{}
	for rows.Next() {
		var d auth.TrustedDevice
		if err := rows.Scan(&d.ID, &d.Name, &d.CreatedAt, &d.LastUsedAt, &d.ExpiresAt); err != nil {
			return nil, err
		}
		devices = append(devices, d)
	}
	return devices, rows.Err()
}
func (r *TrustedDeviceRepo) Revoke(ctx context.Context, id, owner uuid.UUID, now time.Time) (bool, error) {
	tag, err := r.pool.Exec(ctx, `UPDATE public.admin_trusted_devices SET revoked_at=$3 WHERE id=$1 AND admin_id=$2 AND revoked_at IS NULL`, id, owner, now)
	return tag.RowsAffected() == 1, err
}
