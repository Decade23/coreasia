package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type TenantRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Tenant, error)
	FindBySlug(ctx context.Context, slug string) (*entity.Tenant, error)
	FindAll(ctx context.Context) ([]entity.Tenant, error)
	Create(ctx context.Context, tenant *entity.Tenant) error
	Update(ctx context.Context, tenant *entity.Tenant) error
}
