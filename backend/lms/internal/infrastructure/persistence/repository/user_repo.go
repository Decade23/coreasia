package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/infrastructure/persistence/postgres"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type UserRepo struct {
	db *postgres.TenantDB
}

func NewUserRepo(db *postgres.TenantDB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.User, error) {
	schema := schemaFromCtx(ctx)
	row := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT id, email, password_hash, full_name, phone_number, role, is_active, last_login_at, created_at, updated_at FROM %s.users WHERE id = $1",
			pgx.Identifier{schema}.Sanitize()), id)

	return scanUser(row)
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	schema := schemaFromCtx(ctx)
	row := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT id, email, password_hash, full_name, phone_number, role, is_active, last_login_at, created_at, updated_at FROM %s.users WHERE email = $1",
			pgx.Identifier{schema}.Sanitize()), email)

	return scanUser(row)
}

func (r *UserRepo) FindAll(ctx context.Context, page, perPage int, search string) ([]entity.User, int, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	offset := (page - 1) * perPage

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s.users", prefix)
	args := []interface{}{}

	if search != "" {
		countQuery += " WHERE full_name ILIKE $1 OR email ILIKE $1"
		args = append(args, "%"+search+"%")
	}

	if err := r.db.Pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf("SELECT id, email, password_hash, full_name, phone_number, role, is_active, last_login_at, created_at, updated_at FROM %s.users", prefix)
	if search != "" {
		query += " WHERE full_name ILIKE $1 OR email ILIKE $1"
		query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT %d OFFSET %d", perPage, offset)
	} else {
		query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT %d OFFSET %d", perPage, offset)
	}

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []entity.User
	for rows.Next() {
		user, err := scanUserFromRows(rows)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, *user)
	}

	return users, total, rows.Err()
}

func (r *UserRepo) Create(ctx context.Context, user *entity.User) error {
	schema := schemaFromCtx(ctx)
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s.users (id, email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, pgx.Identifier{schema}.Sanitize()),
		user.ID, user.Email, user.PasswordHash, user.FullName, user.PhoneNumber, user.Role, user.IsActive, time.Now(), time.Now())
	return err
}

func (r *UserRepo) Update(ctx context.Context, user *entity.User) error {
	schema := schemaFromCtx(ctx)
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.users SET email=$2, full_name=$3, phone_number=$4, role=$5, is_active=$6, updated_at=$7 WHERE id=$1`,
			pgx.Identifier{schema}.Sanitize()),
		user.ID, user.Email, user.FullName, user.PhoneNumber, user.Role, user.IsActive, time.Now())
	return err
}

func (r *UserRepo) Delete(ctx context.Context, id uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("DELETE FROM %s.users WHERE id = $1",
			pgx.Identifier{schema}.Sanitize()), id)
	return err
}

func (r *UserRepo) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("UPDATE %s.users SET last_login_at = $2 WHERE id = $1",
			pgx.Identifier{schema}.Sanitize()),
		id, time.Now())
	return err
}

func scanUser(row pgx.Row) (*entity.User, error) {
	var u entity.User
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.PhoneNumber, &u.Role, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func scanUserFromRows(rows pgx.Rows) (*entity.User, error) {
	var u entity.User
	err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.PhoneNumber, &u.Role, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

type schemaKey string

const SchemaContextKey schemaKey = "tenant_schema"

func schemaFromCtx(ctx context.Context) string {
	if schema, ok := ctx.Value(SchemaContextKey).(string); ok && schema != "" {
		return schema
	}
	return "_template"
}
