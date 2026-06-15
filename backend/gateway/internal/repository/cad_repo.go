package repository

import (
	"context"
	"fmt"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CADRepo struct {
	pool *pgxpool.Pool
}

func NewCADRepo(pool *pgxpool.Pool) *CADRepo {
	return &CADRepo{pool: pool}
}

// ───────────────────────── Licenses ─────────────────────────

func (r *CADRepo) FindAll(ctx context.Context) ([]model.CADLicense, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT l.id, l.license_key, l.email, l.tier, l.status, l.order_ref, l.device_limit, l.expires_at, l.notes, l.created_by, l.created_at, l.updated_at,
		        (SELECT count(*) FROM public.cad_installations i WHERE i.license_id = l.id AND i.revoked = false) AS device_count
		 FROM public.cad_licenses l ORDER BY l.created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("listing cad licenses: %w", err)
	}
	defer rows.Close()

	var out []model.CADLicense
	for rows.Next() {
		var l model.CADLicense
		if err := rows.Scan(&l.ID, &l.LicenseKey, &l.Email, &l.Tier, &l.Status, &l.OrderRef, &l.DeviceLimit, &l.ExpiresAt, &l.Notes, &l.CreatedBy, &l.CreatedAt, &l.UpdatedAt, &l.DeviceCount); err != nil {
			return nil, fmt.Errorf("scanning cad license: %w", err)
		}
		out = append(out, l)
	}
	return out, nil
}

func (r *CADRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.CADLicense, error) {
	var l model.CADLicense
	err := r.pool.QueryRow(ctx,
		`SELECT l.id, l.license_key, l.email, l.tier, l.status, l.order_ref, l.device_limit, l.expires_at, l.notes, l.created_by, l.created_at, l.updated_at,
		        (SELECT count(*) FROM public.cad_installations i WHERE i.license_id = l.id AND i.revoked = false)
		 FROM public.cad_licenses l WHERE l.id = $1`, id).
		Scan(&l.ID, &l.LicenseKey, &l.Email, &l.Tier, &l.Status, &l.OrderRef, &l.DeviceLimit, &l.ExpiresAt, &l.Notes, &l.CreatedBy, &l.CreatedAt, &l.UpdatedAt, &l.DeviceCount)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("finding cad license: %w", err)
	}
	return &l, nil
}

func (r *CADRepo) FindByKey(ctx context.Context, key string) (*model.CADLicense, error) {
	var l model.CADLicense
	err := r.pool.QueryRow(ctx,
		`SELECT id, license_key, email, tier, status, order_ref, device_limit, expires_at, notes, created_by, created_at, updated_at
		 FROM public.cad_licenses WHERE license_key = $1`, key).
		Scan(&l.ID, &l.LicenseKey, &l.Email, &l.Tier, &l.Status, &l.OrderRef, &l.DeviceLimit, &l.ExpiresAt, &l.Notes, &l.CreatedBy, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("finding cad license by key: %w", err)
	}
	return &l, nil
}

func (r *CADRepo) Create(ctx context.Context, l *model.CADLicense) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO public.cad_licenses (license_key, email, tier, status, order_ref, device_limit, expires_at, notes, created_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		 RETURNING id, created_at, updated_at`,
		l.LicenseKey, l.Email, l.Tier, l.Status, l.OrderRef, l.DeviceLimit, l.ExpiresAt, l.Notes, l.CreatedBy).
		Scan(&l.ID, &l.CreatedAt, &l.UpdatedAt)
}

func (r *CADRepo) Update(ctx context.Context, l *model.CADLicense) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE public.cad_licenses
		 SET email=$2, tier=$3, status=$4, order_ref=$5, device_limit=$6, expires_at=$7, notes=$8, updated_at=now()
		 WHERE id=$1`,
		l.ID, l.Email, l.Tier, l.Status, l.OrderRef, l.DeviceLimit, l.ExpiresAt, l.Notes)
	return err
}

func (r *CADRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM public.cad_licenses WHERE id=$1`, id)
	return err
}

// ImportBatch inserts pre-generated keys, skipping duplicates. Returns inserted count.
func (r *CADRepo) ImportBatch(ctx context.Context, keys []string, tier string, createdBy *uuid.UUID) (int, error) {
	if tier == "" {
		tier = "lifetime"
	}
	inserted := 0
	for _, k := range keys {
		if k == "" {
			continue
		}
		ct, err := r.pool.Exec(ctx,
			`INSERT INTO public.cad_licenses (license_key, tier, status, created_by)
			 VALUES ($1,$2,'active',$3) ON CONFLICT (license_key) DO NOTHING`, k, tier, createdBy)
		if err != nil {
			return inserted, fmt.Errorf("importing cad license: %w", err)
		}
		inserted += int(ct.RowsAffected())
	}
	return inserted, nil
}

// AssignNextUnsoldLicense claims a license key for a paid order, idempotently.
//
//   - If a row already carries this order_ref, it's returned as-is (so webhook
//     retries never issue 2 keys for the same purchase).
//   - Otherwise the oldest unsold key (status='active' AND order_ref IS NULL) is
//     atomically claimed via SELECT ... FOR UPDATE SKIP LOCKED and stamped with
//     the buyer email + order_ref.
//   - Returns (nil, nil) when the pool is exhausted (no unsold keys left).
func (r *CADRepo) AssignNextUnsoldLicense(ctx context.Context, email, orderRef string) (*model.CADLicense, error) {
	// Idempotency first: same order already fulfilled?
	existing, err := r.findByOrderRef(ctx, orderRef)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return existing, nil
	}

	var l model.CADLicense
	err = r.pool.QueryRow(ctx,
		`UPDATE public.cad_licenses
		 SET email = $1, order_ref = $2, updated_at = now()
		 WHERE id = (
		     SELECT id FROM public.cad_licenses
		     WHERE status = 'active' AND order_ref IS NULL
		     ORDER BY created_at
		     LIMIT 1 FOR UPDATE SKIP LOCKED
		 )
		 RETURNING id, license_key, email, tier, status, order_ref, device_limit, expires_at, notes, created_by, created_at, updated_at`,
		email, orderRef).
		Scan(&l.ID, &l.LicenseKey, &l.Email, &l.Tier, &l.Status, &l.OrderRef, &l.DeviceLimit, &l.ExpiresAt, &l.Notes, &l.CreatedBy, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			// Pool exhausted: no unsold keys available.
			return nil, nil
		}
		return nil, fmt.Errorf("assigning cad license: %w", err)
	}
	return &l, nil
}

// findByOrderRef returns the license already bound to an order_ref, or nil.
func (r *CADRepo) findByOrderRef(ctx context.Context, orderRef string) (*model.CADLicense, error) {
	var l model.CADLicense
	err := r.pool.QueryRow(ctx,
		`SELECT id, license_key, email, tier, status, order_ref, device_limit, expires_at, notes, created_by, created_at, updated_at
		 FROM public.cad_licenses WHERE order_ref = $1 LIMIT 1`, orderRef).
		Scan(&l.ID, &l.LicenseKey, &l.Email, &l.Tier, &l.Status, &l.OrderRef, &l.DeviceLimit, &l.ExpiresAt, &l.Notes, &l.CreatedBy, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("finding cad license by order_ref: %w", err)
	}
	return &l, nil
}

// ───────────────────────── Installations / devices ─────────────────────────

func (r *CADRepo) CountActiveDevices(ctx context.Context, licenseID uuid.UUID) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT count(*) FROM public.cad_installations WHERE license_id=$1 AND revoked=false`, licenseID).Scan(&n)
	return n, err
}

func (r *CADRepo) FindInstallation(ctx context.Context, licenseID uuid.UUID, deviceHash string) (*model.CADInstallation, error) {
	var i model.CADInstallation
	err := r.pool.QueryRow(ctx,
		`SELECT id, license_id, device_hash, app_version, os_version, revoked, first_seen, last_seen
		 FROM public.cad_installations WHERE license_id=$1 AND device_hash=$2`, licenseID, deviceHash).
		Scan(&i.ID, &i.LicenseID, &i.DeviceHash, &i.AppVersion, &i.OSVersion, &i.Revoked, &i.FirstSeen, &i.LastSeen)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("finding installation: %w", err)
	}
	return &i, nil
}

func (r *CADRepo) CreateInstallation(ctx context.Context, i *model.CADInstallation) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO public.cad_installations (license_id, device_hash, app_version, os_version)
		 VALUES ($1,$2,$3,$4) RETURNING id, first_seen, last_seen`,
		i.LicenseID, i.DeviceHash, i.AppVersion, i.OSVersion).
		Scan(&i.ID, &i.FirstSeen, &i.LastSeen)
}

// TouchInstallation refreshes last_seen + version info for an existing device.
func (r *CADRepo) TouchInstallation(ctx context.Context, id uuid.UUID, appVersion, osVersion *string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE public.cad_installations SET last_seen=now(), app_version=COALESCE($2,app_version), os_version=COALESCE($3,os_version), revoked=false WHERE id=$1`,
		id, appVersion, osVersion)
	return err
}

// ListInstallations returns recent devices (optionally filtered by license).
func (r *CADRepo) ListInstallations(ctx context.Context, licenseID *uuid.UUID, limit int) ([]model.CADInstallation, error) {
	if limit <= 0 || limit > 500 {
		limit = 200
	}
	var rows interface {
		Next() bool
		Scan(...any) error
		Close()
		Err() error
	}
	var err error
	if licenseID != nil {
		rows, err = r.pool.Query(ctx,
			`SELECT id, license_id, device_hash, app_version, os_version, revoked, first_seen, last_seen
			 FROM public.cad_installations WHERE license_id=$1 ORDER BY last_seen DESC LIMIT $2`, *licenseID, limit)
	} else {
		rows, err = r.pool.Query(ctx,
			`SELECT id, license_id, device_hash, app_version, os_version, revoked, first_seen, last_seen
			 FROM public.cad_installations ORDER BY last_seen DESC LIMIT $1`, limit)
	}
	if err != nil {
		return nil, fmt.Errorf("listing installations: %w", err)
	}
	defer rows.Close()

	var out []model.CADInstallation
	for rows.Next() {
		var i model.CADInstallation
		if err := rows.Scan(&i.ID, &i.LicenseID, &i.DeviceHash, &i.AppVersion, &i.OSVersion, &i.Revoked, &i.FirstSeen, &i.LastSeen); err != nil {
			return nil, fmt.Errorf("scanning installation: %w", err)
		}
		out = append(out, i)
	}
	return out, rows.Err()
}

// ───────────────────────── Analytics ─────────────────────────

func (r *CADRepo) InsertEvent(ctx context.Context, e *model.CADTelemetryRequest, country *string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO public.cad_analytics_events (install_id, event_type, app_version, os_version, country)
		 VALUES ($1,$2,$3,$4,$5)`,
		e.InstallID, e.EventType, e.AppVersion, e.OSVersion, country)
	return err
}

func (r *CADRepo) Summary(ctx context.Context) (*model.CADAnalyticsSummary, error) {
	s := &model.CADAnalyticsSummary{DailyActive: []model.CADTimePoint{}}

	_ = r.pool.QueryRow(ctx, `SELECT count(*) FROM public.cad_licenses`).Scan(&s.TotalLicenses)
	_ = r.pool.QueryRow(ctx, `SELECT count(*) FROM public.cad_licenses WHERE status='active'`).Scan(&s.ActiveLicenses)
	_ = r.pool.QueryRow(ctx, `SELECT count(*) FROM public.cad_installations WHERE revoked=false`).Scan(&s.TotalDevices)
	_ = r.pool.QueryRow(ctx, `SELECT count(*) FROM public.cad_installations WHERE revoked=false AND last_seen > now() - interval '30 days'`).Scan(&s.ActiveDevices)

	s.ByVersion = r.countBy(ctx, `SELECT COALESCE(app_version,'unknown'), count(*) FROM public.cad_installations WHERE revoked=false GROUP BY app_version ORDER BY count(*) DESC LIMIT 10`)
	s.ByOS = r.countBy(ctx, `SELECT COALESCE(os_version,'unknown'), count(*) FROM public.cad_installations WHERE revoked=false GROUP BY os_version ORDER BY count(*) DESC LIMIT 10`)

	rows, err := r.pool.Query(ctx,
		`SELECT to_char(created_at::date,'YYYY-MM-DD') AS d, count(distinct install_id)
		 FROM public.cad_analytics_events WHERE created_at > now() - interval '14 days'
		 GROUP BY d ORDER BY d`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var tp model.CADTimePoint
			if err := rows.Scan(&tp.Date, &tp.Count); err == nil {
				s.DailyActive = append(s.DailyActive, tp)
			}
		}
	}
	return s, nil
}

func (r *CADRepo) countBy(ctx context.Context, query string) []model.CADCount {
	out := []model.CADCount{}
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return out
	}
	defer rows.Close()
	for rows.Next() {
		var c model.CADCount
		if err := rows.Scan(&c.Label, &c.Count); err == nil {
			out = append(out, c)
		}
	}
	return out
}
