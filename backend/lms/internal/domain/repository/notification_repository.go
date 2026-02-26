package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type NotificationRepository interface {
	FindByUser(ctx context.Context, userID uuid.UUID) ([]entity.Notification, error)
	MarkAsRead(ctx context.Context, id uuid.UUID) error
	Create(ctx context.Context, n *entity.Notification) error
}
