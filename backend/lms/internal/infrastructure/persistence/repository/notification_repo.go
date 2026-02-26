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

type NotificationRepo struct {
	db *postgres.TenantDB
}

func NewNotificationRepo(db *postgres.TenantDB) *NotificationRepo {
	return &NotificationRepo{db: db}
}

func (r *NotificationRepo) FindByUser(ctx context.Context, userID uuid.UUID) ([]entity.Notification, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf("SELECT id, user_id, title, message, type, is_read, created_at FROM %s.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", prefix),
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []entity.Notification
	for rows.Next() {
		var n entity.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Message, &n.Type, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}

	return notifications, rows.Err()
}

func (r *NotificationRepo) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("UPDATE %s.notifications SET is_read = true WHERE id = $1", prefix), id)
	return err
}

func (r *NotificationRepo) Create(ctx context.Context, n *entity.Notification) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	n.CreatedAt = time.Now()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s.notifications (id, user_id, title, message, type, is_read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`, prefix),
		n.ID, n.UserID, n.Title, n.Message, n.Type, n.IsRead, n.CreatedAt)
	return err
}
