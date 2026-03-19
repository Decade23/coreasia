package repository

import (
	"context"
	"fmt"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminUserRepo struct {
	pool *pgxpool.Pool
}

func NewAdminUserRepo(pool *pgxpool.Pool) *AdminUserRepo {
	return &AdminUserRepo{pool: pool}
}

func (r *AdminUserRepo) FindByEmail(ctx context.Context, email string) (*model.AdminUser, error) {
	query := `
		SELECT id, email, password_hash, full_name, role, is_active, last_login_at, created_at, updated_at
		FROM public.admin_users
		WHERE email = $1
	`
	var u model.AdminUser
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role,
		&u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("finding admin by email: %w", err)
	}
	return &u, nil
}

func (r *AdminUserRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.AdminUser, error) {
	query := `
		SELECT id, email, password_hash, full_name, role, is_active, last_login_at, created_at, updated_at
		FROM public.admin_users
		WHERE id = $1
	`
	var u model.AdminUser
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role,
		&u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("finding admin by id: %w", err)
	}
	return &u, nil
}

func (r *AdminUserRepo) FindAll(ctx context.Context, page, perPage int) ([]model.AdminUser, int, error) {
	offset := (page - 1) * perPage

	var total int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM public.admin_users").Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting admin users: %w", err)
	}

	query := `
		SELECT id, email, password_hash, full_name, role, is_active, last_login_at, created_at, updated_at
		FROM public.admin_users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.pool.Query(ctx, query, perPage, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("listing admin users: %w", err)
	}
	defer rows.Close()

	var users []model.AdminUser
	for rows.Next() {
		var u model.AdminUser
		if err := rows.Scan(
			&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role,
			&u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scanning admin user: %w", err)
		}
		users = append(users, u)
	}
	return users, total, rows.Err()
}

func (r *AdminUserRepo) Create(ctx context.Context, u *model.AdminUser) error {
	query := `
		INSERT INTO public.admin_users (email, password_hash, full_name, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	return r.pool.QueryRow(ctx, query, u.Email, u.PasswordHash, u.FullName, u.Role).
		Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
}

func (r *AdminUserRepo) Update(ctx context.Context, u *model.AdminUser) error {
	query := `
		UPDATE public.admin_users
		SET email = $2, full_name = $3, role = $4, is_active = $5, password_hash = $6, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`
	return r.pool.QueryRow(ctx, query, u.ID, u.Email, u.FullName, u.Role, u.IsActive, u.PasswordHash).
		Scan(&u.UpdatedAt)
}

func (r *AdminUserRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM public.admin_users WHERE id = $1", id)
	return err
}

func (r *AdminUserRepo) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		"UPDATE public.admin_users SET last_login_at = NOW() WHERE id = $1", id)
	return err
}
