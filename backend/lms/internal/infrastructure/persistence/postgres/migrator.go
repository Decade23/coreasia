package postgres

import (
	"fmt"
	"log/slog"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type Migrator struct {
	dsn            string
	globalPath     string
	tenantPath     string
}

func NewMigrator(dsn, globalPath, tenantPath string) *Migrator {
	return &Migrator{
		dsn:        dsn,
		globalPath: globalPath,
		tenantPath: tenantPath,
	}
}

func (m *Migrator) RunGlobal() error {
	slog.Info("menjalankan migrasi global (public schema)")

	dbURL := m.dsn + "&search_path=public"
	mg, err := migrate.New("file://"+m.globalPath, dbURL)
	if err != nil {
		return fmt.Errorf("membuat migrator global: %w", err)
	}
	defer mg.Close()

	if err := mg.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrasi global: %w", err)
	}

	slog.Info("migrasi global selesai")
	return nil
}

func (m *Migrator) RunTenant(schemaName string) error {
	slog.Info("menjalankan migrasi tenant", "schema", schemaName)

	dbURL := m.dsn + "&search_path=" + schemaName
	mg, err := migrate.New("file://"+m.tenantPath, dbURL)
	if err != nil {
		return fmt.Errorf("membuat migrator tenant %s: %w", schemaName, err)
	}
	defer mg.Close()

	if err := mg.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrasi tenant %s: %w", schemaName, err)
	}

	slog.Info("migrasi tenant selesai", "schema", schemaName)
	return nil
}

func (m *Migrator) RunAllTenants(schemas []string) error {
	for _, schema := range schemas {
		if err := m.RunTenant(schema); err != nil {
			return err
		}
	}
	return nil
}
