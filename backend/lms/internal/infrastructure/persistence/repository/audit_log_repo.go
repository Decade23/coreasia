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

type AuditLogRepo struct {
	db *postgres.TenantDB
}

func NewAuditLogRepo(db *postgres.TenantDB) *AuditLogRepo {
	return &AuditLogRepo{db: db}
}

func (r *AuditLogRepo) FindAll(ctx context.Context, page, perPage int, resource string) ([]entity.AuditLog, int, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	offset := (page - 1) * perPage

	args := []interface{}{}
	where := ""
	if resource != "" {
		where = " WHERE resource = $1"
		args = append(args, resource)
	}

	var total int
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.audit_logs%s", prefix, where), args...,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT id, user_id, user_name, user_role, action, resource, resource_id, description, ip_address, created_at
		FROM %s.audit_logs%s ORDER BY created_at DESC LIMIT %d OFFSET %d`,
		prefix, where, perPage, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []entity.AuditLog
	for rows.Next() {
		var l entity.AuditLog
		if err := rows.Scan(&l.ID, &l.UserID, &l.UserName, &l.UserRole, &l.Action, &l.Resource, &l.ResourceID, &l.Description, &l.IPAddress, &l.CreatedAt); err != nil {
			return nil, 0, err
		}
		logs = append(logs, l)
	}

	return logs, total, rows.Err()
}

func (r *AuditLogRepo) Create(ctx context.Context, log *entity.AuditLog) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	log.CreatedAt = time.Now()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s.audit_logs (id, user_id, user_name, user_role, action, resource, resource_id, description, ip_address, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, prefix),
		log.ID, log.UserID, log.UserName, log.UserRole, log.Action, log.Resource, log.ResourceID, log.Description, log.IPAddress, log.CreatedAt)
	return err
}
