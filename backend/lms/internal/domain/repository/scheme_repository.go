package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type SchemeRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Scheme, error)
	FindAll(ctx context.Context, page, perPage int, search string) ([]entity.Scheme, int, error)
	Create(ctx context.Context, scheme *entity.Scheme) error
	Update(ctx context.Context, scheme *entity.Scheme) error
	Delete(ctx context.Context, id uuid.UUID) error
}
