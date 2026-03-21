package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AppSettingsRepo struct {
	pool *pgxpool.Pool
}

func NewAppSettingsRepo(pool *pgxpool.Pool) *AppSettingsRepo {
	return &AppSettingsRepo{pool: pool}
}

func (r *AppSettingsRepo) GetAll(ctx context.Context) (map[string]string, error) {
	rows, err := r.pool.Query(ctx, "SELECT key, value FROM public.app_settings")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	settings := make(map[string]string)
	for rows.Next() {
		var k, v string
		if err := rows.Scan(&k, &v); err != nil {
			continue
		}
		settings[k] = v
	}
	return settings, nil
}

func (r *AppSettingsRepo) Get(ctx context.Context, key string) (string, error) {
	var value string
	err := r.pool.QueryRow(ctx, "SELECT value FROM public.app_settings WHERE key = $1", key).Scan(&value)
	if err != nil {
		return "", err
	}
	return value, nil
}

func (r *AppSettingsRepo) SetMultiple(ctx context.Context, settings map[string]string, adminID *uuid.UUID) error {
	for k, v := range settings {
		_, err := r.pool.Exec(ctx,
			`INSERT INTO public.app_settings (key, value, updated_by, updated_at)
			 VALUES ($1, $2, $3, now())
			 ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = now()`,
			k, v, adminID,
		)
		if err != nil {
			return err
		}
	}
	return nil
}
