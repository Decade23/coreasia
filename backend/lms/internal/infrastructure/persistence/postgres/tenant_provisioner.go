package postgres

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5"
)

type TenantProvisioner struct {
	db       *TenantDB
	migrator *Migrator
}

func NewTenantProvisioner(db *TenantDB, migrator *Migrator) *TenantProvisioner {
	return &TenantProvisioner{db: db, migrator: migrator}
}

func (p *TenantProvisioner) Provision(ctx context.Context, schemaName string) error {
	slog.Info("provisioning tenant schema", "schema", schemaName)

	sanitized := pgx.Identifier{schemaName}.Sanitize()

	_, err := p.db.Pool.Exec(ctx, fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", sanitized))
	if err != nil {
		return fmt.Errorf("membuat schema %s: %w", schemaName, err)
	}

	if err := p.migrator.RunTenant(schemaName); err != nil {
		return fmt.Errorf("menjalankan migrasi untuk %s: %w", schemaName, err)
	}

	slog.Info("tenant schema berhasil diprovisioning", "schema", schemaName)
	return nil
}

func (p *TenantProvisioner) ListTenantSchemas(ctx context.Context) ([]string, error) {
	rows, err := p.db.Pool.Query(ctx,
		"SELECT schema_name FROM public.tenants WHERE is_active = true ORDER BY created_at",
	)
	if err != nil {
		return nil, fmt.Errorf("listing tenant schemas: %w", err)
	}
	defer rows.Close()

	var schemas []string
	for rows.Next() {
		var schema string
		if err := rows.Scan(&schema); err != nil {
			return nil, err
		}
		schemas = append(schemas, schema)
	}

	return schemas, rows.Err()
}
