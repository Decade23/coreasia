package middleware

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/coreasia/lms-api/internal/infrastructure"
	"github.com/coreasia/lms-api/internal/infrastructure/persistence/postgres"
	"github.com/coreasia/lms-api/internal/interfaces/http/response"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"
)

type tenantContextKey string

const (
	TenantSchemaKey tenantContextKey = "tenant_schema"
	TenantIDKey     tenantContextKey = "tenant_id"
)

func TenantResolver(db *postgres.TenantDB, cfg infrastructure.TenantConfig) fiber.Handler {
	return func(c fiber.Ctx) error {
		tenantSlug := c.Get(cfg.HeaderKey)
		if tenantSlug == "" {
			tenantSlug = c.Query("tenant")
		}

		if tenantSlug == "" {
			return response.Error(c, apperr.NewBadRequest("Tenant ID diperlukan (header X-Tenant-ID)"))
		}

		schemaName, tenantID, err := resolveTenantSchema(c.Context(), db, tenantSlug)
		if err != nil {
			slog.Error("gagal resolve tenant", "slug", tenantSlug, "error", err)
			return response.Error(c, apperr.NewNotFound("Tenant"))
		}

		c.Locals(string(TenantSchemaKey), schemaName)
		c.Locals(string(TenantIDKey), tenantID)
		return c.Next()
	}
}

func resolveTenantSchema(ctx context.Context, db *postgres.TenantDB, slug string) (string, string, error) {
	var schemaName, tenantID string
	err := db.Pool.QueryRow(ctx,
		"SELECT id::text, schema_name FROM public.tenants WHERE slug = $1 AND is_active = true",
		slug,
	).Scan(&tenantID, &schemaName)

	if err != nil {
		if err == pgx.ErrNoRows {
			return "", "", fmt.Errorf("tenant %s tidak ditemukan", slug)
		}
		return "", "", err
	}

	return schemaName, tenantID, nil
}

func GetTenantSchema(c fiber.Ctx) string {
	schema, _ := c.Locals(string(TenantSchemaKey)).(string)
	return schema
}

func GetTenantID(c fiber.Ctx) string {
	id, _ := c.Locals(string(TenantIDKey)).(string)
	return id
}
