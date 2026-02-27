package service

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Provisioner handles tenant schema creation, migration, and admin user seeding.
type Provisioner struct {
	pool            *pgxpool.Pool
	tenantRepo      *repository.TenantRepo
	dsn             string
	tenantMigPath   string // path to tenant migration files (e.g. "../lms/migrations/tenant")
}

func NewProvisioner(
	pool *pgxpool.Pool,
	tenantRepo *repository.TenantRepo,
	dsn string,
	tenantMigPath string,
) *Provisioner {
	return &Provisioner{
		pool:          pool,
		tenantRepo:    tenantRepo,
		dsn:           dsn,
		tenantMigPath: tenantMigPath,
	}
}

// ProvisionTenant creates the schema, runs migrations, creates the admin user,
// activates the tenant, and updates the registration record.
func (p *Provisioner) ProvisionTenant(ctx context.Context, reg *model.TenantRegistration, tenant *model.Tenant) error {
	schemaName := tenant.SchemaName

	slog.Info("provisioning tenant schema", "schema", schemaName, "tenant_id", tenant.ID)

	// 1. Create schema
	sanitized := pgx.Identifier{schemaName}.Sanitize()
	if _, err := p.pool.Exec(ctx, fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", sanitized)); err != nil {
		return fmt.Errorf("creating schema %s: %w", schemaName, err)
	}

	// 2. Run tenant migrations
	if err := p.runTenantMigrations(schemaName); err != nil {
		return fmt.Errorf("running migrations for %s: %w", schemaName, err)
	}

	// 3. Create admin user in new schema
	if err := p.createAdminUser(ctx, schemaName, reg); err != nil {
		return fmt.Errorf("creating admin user in %s: %w", schemaName, err)
	}

	// 4. Activate tenant
	if err := p.tenantRepo.Activate(ctx, tenant.ID); err != nil {
		return fmt.Errorf("activating tenant: %w", err)
	}

	// 5. Update registration status
	now := time.Now()
	if err := p.tenantRepo.UpdateRegistrationStatus(ctx, reg.ID, "completed", &now, "paid"); err != nil {
		return fmt.Errorf("updating registration status: %w", err)
	}

	slog.Info("tenant provisioned successfully", "schema", schemaName, "tenant_id", tenant.ID)
	return nil
}

func (p *Provisioner) runTenantMigrations(schemaName string) error {
	dbURL := p.dsn + "&search_path=" + schemaName
	mg, err := migrate.New("file://"+p.tenantMigPath, dbURL)
	if err != nil {
		return fmt.Errorf("creating migrator for %s: %w", schemaName, err)
	}
	defer mg.Close()

	if err := mg.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrating %s: %w", schemaName, err)
	}

	return nil
}

func (p *Provisioner) createAdminUser(ctx context.Context, schemaName string, reg *model.TenantRegistration) error {
	sanitized := pgx.Identifier{schemaName}.Sanitize()

	query := fmt.Sprintf(`
		INSERT INTO %s.users (id, email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, 'admin', true, NOW(), NOW())
		ON CONFLICT (email) DO NOTHING
	`, sanitized)

	adminID := uuid.New()
	_, err := p.pool.Exec(ctx, query,
		adminID, reg.AdminEmail, reg.PasswordHash, reg.AdminName, reg.AdminPhone,
	)
	if err != nil {
		return fmt.Errorf("inserting admin user: %w", err)
	}

	// Seed default tenant settings
	settingsQuery := fmt.Sprintf(`
		INSERT INTO %s.tenant_settings (setting_key, setting_value) VALUES
			('general', '{"institution_name": "%s", "logo_url": null, "primary_color": "#10b981"}'),
			('certification', '{"auto_certificate": true, "validity_years": 3, "number_format": "CERT/{year}/{seq}"}'),
			('notification', '{"email_enabled": true, "whatsapp_enabled": false}')
		ON CONFLICT (setting_key) DO NOTHING
	`, sanitized, reg.OrgName)

	if _, err := p.pool.Exec(ctx, settingsQuery); err != nil {
		slog.Warn("failed to seed tenant settings (non-fatal)", "schema", schemaName, "error", err)
	}

	return nil
}
