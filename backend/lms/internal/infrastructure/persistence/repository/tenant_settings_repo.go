package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/coreasia/lms-api/internal/infrastructure/persistence/postgres"
	"github.com/jackc/pgx/v5"
)

type TenantSettingsRepo struct {
	db *postgres.TenantDB
}

func NewTenantSettingsRepo(db *postgres.TenantDB) *TenantSettingsRepo {
	return &TenantSettingsRepo{db: db}
}

func (r *TenantSettingsRepo) GetAll(ctx context.Context) (map[string]interface{}, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf("SELECT setting_key, setting_value FROM %s.tenant_settings", prefix))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	settings := make(map[string]interface{})
	for rows.Next() {
		var key string
		var value []byte
		if err := rows.Scan(&key, &value); err != nil {
			return nil, err
		}
		var parsed interface{}
		if err := json.Unmarshal(value, &parsed); err != nil {
			settings[key] = string(value)
		} else {
			settings[key] = parsed
		}
	}

	return settings, rows.Err()
}

func (r *TenantSettingsRepo) Update(ctx context.Context, settings map[string]interface{}) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, fmt.Sprintf("SET search_path TO %s, public", prefix))
	if err != nil {
		return err
	}

	for key, value := range settings {
		jsonValue, err := json.Marshal(value)
		if err != nil {
			return err
		}
		_, err = tx.Exec(ctx,
			`INSERT INTO tenant_settings (id, setting_key, setting_value, updated_at) VALUES (gen_random_uuid(), $1, $2, $3)
			ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = $3`,
			key, jsonValue, time.Now())
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}
