package repository

import (
	"context"
	"fmt"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type APIKeyRepo struct {
	pool *pgxpool.Pool
}

func NewAPIKeyRepo(pool *pgxpool.Pool) *APIKeyRepo {
	return &APIKeyRepo{pool: pool}
}

func (r *APIKeyRepo) FindAll(ctx context.Context) ([]model.APIKey, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, provider, key_value, description, is_active, created_by, created_at, updated_at
		 FROM public.api_keys ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("listing api keys: %w", err)
	}
	defer rows.Close()

	var keys []model.APIKey
	for rows.Next() {
		var k model.APIKey
		if err := rows.Scan(&k.ID, &k.Name, &k.Provider, &k.KeyValue, &k.Description, &k.IsActive, &k.CreatedBy, &k.CreatedAt, &k.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning api key: %w", err)
		}
		keys = append(keys, k)
	}
	return keys, nil
}

func (r *APIKeyRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.APIKey, error) {
	var k model.APIKey
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, provider, key_value, description, is_active, created_by, created_at, updated_at
		 FROM public.api_keys WHERE id = $1`, id).
		Scan(&k.ID, &k.Name, &k.Provider, &k.KeyValue, &k.Description, &k.IsActive, &k.CreatedBy, &k.CreatedAt, &k.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("finding api key by id: %w", err)
	}
	return &k, nil
}

// FindActiveByProvider returns the active key for a given provider.
func (r *APIKeyRepo) FindActiveByProvider(ctx context.Context, provider string) (*model.APIKey, error) {
	var k model.APIKey
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, provider, key_value, description, is_active, created_by, created_at, updated_at
		 FROM public.api_keys WHERE provider = $1 AND is_active = true ORDER BY updated_at DESC LIMIT 1`, provider).
		Scan(&k.ID, &k.Name, &k.Provider, &k.KeyValue, &k.Description, &k.IsActive, &k.CreatedBy, &k.CreatedAt, &k.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("finding active api key by provider: %w", err)
	}
	return &k, nil
}

func (r *APIKeyRepo) Create(ctx context.Context, k *model.APIKey) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO public.api_keys (name, provider, key_value, description, is_active, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, created_at, updated_at`,
		k.Name, k.Provider, k.KeyValue, k.Description, k.IsActive, k.CreatedBy).
		Scan(&k.ID, &k.CreatedAt, &k.UpdatedAt)
}

func (r *APIKeyRepo) Update(ctx context.Context, k *model.APIKey) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE public.api_keys
		 SET name = $2, provider = $3, key_value = $4, description = $5, is_active = $6, updated_at = now()
		 WHERE id = $1`,
		k.ID, k.Name, k.Provider, k.KeyValue, k.Description, k.IsActive)
	return err
}

func (r *APIKeyRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM public.api_keys WHERE id = $1`, id)
	return err
}
