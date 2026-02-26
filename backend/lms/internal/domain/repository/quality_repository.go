package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type QualityRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.QualityReview, error)
	FindAll(ctx context.Context, page, perPage int, status string) ([]entity.QualityReview, int, error)
	Create(ctx context.Context, review *entity.QualityReview) error
	Update(ctx context.Context, review *entity.QualityReview) error
	Stats(ctx context.Context) (map[string]interface{}, error)
}
