package seeder

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed seeds/global/system/*.sql
var globalSystemSeeds embed.FS

//go:embed seeds/tenant/system/*.sql
var tenantSystemSeeds embed.FS

//go:embed seeds/tenant/dev/*.sql
var tenantDevSeeds embed.FS

type Seeder struct {
	pool *pgxpool.Pool
}

func NewSeeder(pool *pgxpool.Pool) *Seeder {
	return &Seeder{pool: pool}
}

// RunGlobalSystem executes global system seeds (e.g., subscription plans).
func (s *Seeder) RunGlobalSystem(ctx context.Context) error {
	slog.Info("menjalankan global system seeds")
	return s.runSeeds(ctx, globalSystemSeeds, "seeds/global/system", "")
}

// RunTenantSystem executes system seeds for a specific tenant schema.
func (s *Seeder) RunTenantSystem(ctx context.Context, schemaName string) error {
	slog.Info("menjalankan tenant system seeds", "schema", schemaName)
	return s.runSeeds(ctx, tenantSystemSeeds, "seeds/tenant/system", schemaName)
}

// RunTenantDev executes dev seeds for a specific tenant schema.
func (s *Seeder) RunTenantDev(ctx context.Context, schemaName string) error {
	slog.Info("menjalankan tenant dev seeds", "schema", schemaName)
	return s.runSeeds(ctx, tenantDevSeeds, "seeds/tenant/dev", schemaName)
}

// RunAllTenants executes seeds for all provided tenant schemas.
func (s *Seeder) RunAllTenants(ctx context.Context, schemas []string, includeDev bool) error {
	for _, schema := range schemas {
		if err := s.RunTenantSystem(ctx, schema); err != nil {
			return fmt.Errorf("tenant system seed %s: %w", schema, err)
		}
		if includeDev {
			if err := s.RunTenantDev(ctx, schema); err != nil {
				return fmt.Errorf("tenant dev seed %s: %w", schema, err)
			}
		}
	}
	return nil
}

func (s *Seeder) runSeeds(ctx context.Context, fsys embed.FS, dir string, schemaName string) error {
	entries, err := fs.ReadDir(fsys, dir)
	if err != nil {
		return fmt.Errorf("reading seed dir %s: %w", dir, err)
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		content, err := fs.ReadFile(fsys, dir+"/"+entry.Name())
		if err != nil {
			return fmt.Errorf("reading seed file %s: %w", entry.Name(), err)
		}

		sql := string(content)

		// If schema is specified, execute within that schema's search_path
		if schemaName != "" {
			sanitized := pgx.Identifier{schemaName}.Sanitize()
			sql = fmt.Sprintf("SET search_path TO %s, public;\n%s\nSET search_path TO public;", sanitized, sql)
		}

		slog.Info("applying seed", "file", entry.Name(), "schema", schemaName)
		if _, err := s.pool.Exec(ctx, sql); err != nil {
			return fmt.Errorf("executing seed %s: %w", entry.Name(), err)
		}
	}

	return nil
}
