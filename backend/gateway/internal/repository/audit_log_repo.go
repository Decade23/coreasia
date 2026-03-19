package repository

import (
	"context"
	"fmt"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuditLogRepo struct {
	pool *pgxpool.Pool
}

func NewAuditLogRepo(pool *pgxpool.Pool) *AuditLogRepo {
	return &AuditLogRepo{pool: pool}
}

func (r *AuditLogRepo) Create(ctx context.Context, log *model.GatewayAuditLog) error {
	query := `
		INSERT INTO public.gateway_audit_logs (user_id, user_name, action, resource, resource_id, description, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`
	return r.pool.QueryRow(ctx, query,
		log.UserID, log.UserName, log.Action, log.Resource, log.ResourceID,
		log.Description, log.IPAddress,
	).Scan(&log.ID, &log.CreatedAt)
}

func (r *AuditLogRepo) FindAll(ctx context.Context, page, perPage int, resource string) ([]model.GatewayAuditLog, int, error) {
	offset := (page - 1) * perPage

	whereClause := ""
	args := []interface{}{}
	argIdx := 1

	if resource != "" {
		whereClause = fmt.Sprintf(" WHERE resource = $%d", argIdx)
		args = append(args, resource)
		argIdx++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM public.gateway_audit_logs%s", whereClause)
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting audit logs: %w", err)
	}

	query := fmt.Sprintf(`
		SELECT id, user_id, user_name, action, resource, resource_id, description, ip_address, created_at
		FROM public.gateway_audit_logs%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)
	args = append(args, perPage, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("listing audit logs: %w", err)
	}
	defer rows.Close()

	var logs []model.GatewayAuditLog
	for rows.Next() {
		var l model.GatewayAuditLog
		if err := rows.Scan(
			&l.ID, &l.UserID, &l.UserName, &l.Action, &l.Resource,
			&l.ResourceID, &l.Description, &l.IPAddress, &l.CreatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scanning audit log: %w", err)
		}
		logs = append(logs, l)
	}
	return logs, total, rows.Err()
}

func (r *AuditLogRepo) LogAction(ctx context.Context, userID *uuid.UUID, userName *string, action, resource string, resourceID *string, description *string, ip string) {
	log := &model.GatewayAuditLog{
		UserID:      userID,
		UserName:    userName,
		Action:      action,
		Resource:    resource,
		ResourceID:  resourceID,
		Description: description,
		IPAddress:   &ip,
	}
	if err := r.Create(ctx, log); err != nil {
		// Log but don't fail the request
		fmt.Printf("audit log error: %v\n", err)
	}
}
