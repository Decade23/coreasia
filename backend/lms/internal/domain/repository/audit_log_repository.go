package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
)

type AuditLogRepository interface {
	FindAll(ctx context.Context, page, perPage int, resource string) ([]entity.AuditLog, int, error)
	Create(ctx context.Context, log *entity.AuditLog) error
}
