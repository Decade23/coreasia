package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantRepo struct {
	pool *pgxpool.Pool
}

func NewTenantRepo(pool *pgxpool.Pool) *TenantRepo {
	return &TenantRepo{pool: pool}
}

// FindBySlug looks up a tenant by slug. Returns nil, nil if not found.
func (r *TenantRepo) FindBySlug(ctx context.Context, slug string) (*model.Tenant, error) {
	query := `
		SELECT id, name, slug, schema_name, domain, is_active, plan_id, created_at, updated_at
		FROM public.tenants
		WHERE slug = $1
	`

	var t model.Tenant
	err := r.pool.QueryRow(ctx, query, slug).Scan(
		&t.ID, &t.Name, &t.Slug, &t.SchemaName,
		&t.Domain, &t.IsActive, &t.PlanID,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("finding tenant by slug: %w", err)
	}

	return &t, nil
}

// FindByID looks up a tenant by ID. Returns nil, nil if not found.
func (r *TenantRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Tenant, error) {
	query := `
		SELECT id, name, slug, schema_name, domain, is_active, plan_id, created_at, updated_at
		FROM public.tenants
		WHERE id = $1
	`

	var t model.Tenant
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&t.ID, &t.Name, &t.Slug, &t.SchemaName,
		&t.Domain, &t.IsActive, &t.PlanID,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("finding tenant by id: %w", err)
	}

	return &t, nil
}

// Create inserts a new tenant row in the public schema.
func (r *TenantRepo) Create(ctx context.Context, t *model.Tenant) error {
	query := `
		INSERT INTO public.tenants (id, name, slug, schema_name, domain, is_active, plan_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	now := time.Now()
	t.CreatedAt = now
	t.UpdatedAt = now
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}

	_, err := r.pool.Exec(ctx, query,
		t.ID, t.Name, t.Slug, t.SchemaName,
		t.Domain, t.IsActive, t.PlanID,
		t.CreatedAt, t.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("creating tenant: %w", err)
	}

	return nil
}

// Activate sets a tenant's is_active flag to true.
func (r *TenantRepo) Activate(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE public.tenants
		SET is_active = true, updated_at = NOW()
		WHERE id = $1
	`

	tag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("activating tenant: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("tenant %s not found", id)
	}

	return nil
}

// CreateRegistration inserts a new tenant_registrations row.
func (r *TenantRepo) CreateRegistration(ctx context.Context, reg *model.TenantRegistration) error {
	query := `
		INSERT INTO public.tenant_registrations (
			id, tenant_id, org_name, org_type, admin_email, admin_name, admin_phone,
			password_hash, plan_id, payment_status, amount, provision_status,
			is_trial, trial_ends_at, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12,
			$13, $14, $15, $16
		)
	`

	now := time.Now()
	reg.CreatedAt = now
	reg.UpdatedAt = now
	if reg.ID == uuid.Nil {
		reg.ID = uuid.New()
	}

	_, err := r.pool.Exec(ctx, query,
		reg.ID, reg.TenantID, reg.OrgName, reg.OrgType,
		reg.AdminEmail, reg.AdminName, reg.AdminPhone,
		reg.PasswordHash, reg.PlanID, reg.PaymentStatus,
		reg.Amount, reg.ProvisionStatus,
		reg.IsTrial, reg.TrialEndsAt,
		reg.CreatedAt, reg.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("creating tenant registration: %w", err)
	}

	return nil
}

// FindRegistrationByID fetches a tenant registration by its ID.
func (r *TenantRepo) FindRegistrationByID(ctx context.Context, id uuid.UUID) (*model.TenantRegistration, error) {
	query := `
		SELECT id, tenant_id, org_name, org_type, admin_email, admin_name, admin_phone,
			   password_hash, plan_id, payment_status, payment_method, paid_at, amount,
			   provision_status, provisioned_at, is_trial, trial_ends_at, created_at, updated_at
		FROM public.tenant_registrations
		WHERE id = $1
	`

	var reg model.TenantRegistration
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&reg.ID, &reg.TenantID, &reg.OrgName, &reg.OrgType,
		&reg.AdminEmail, &reg.AdminName, &reg.AdminPhone,
		&reg.PasswordHash, &reg.PlanID, &reg.PaymentStatus,
		&reg.PaymentMethod, &reg.PaidAt, &reg.Amount,
		&reg.ProvisionStatus, &reg.ProvisionedAt,
		&reg.IsTrial, &reg.TrialEndsAt,
		&reg.CreatedAt, &reg.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("finding registration by id: %w", err)
	}

	return &reg, nil
}

// UpdateRegistrationStatus updates payment and provision status fields.
func (r *TenantRepo) UpdateRegistrationStatus(ctx context.Context, id uuid.UUID, provisionStatus string, provisionedAt *time.Time, paymentStatus string) error {
	query := `
		UPDATE public.tenant_registrations
		SET provision_status = $2, provisioned_at = $3, payment_status = $4, updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.pool.Exec(ctx, query, id, provisionStatus, provisionedAt, paymentStatus)
	if err != nil {
		return fmt.Errorf("updating registration status: %w", err)
	}

	return nil
}
