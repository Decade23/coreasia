package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type AssessmentRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Assessment, error)
	FindAll(ctx context.Context, page, perPage int) ([]entity.Assessment, int, error)
	Create(ctx context.Context, assessment *entity.Assessment) error
	Update(ctx context.Context, assessment *entity.Assessment) error
	SaveResults(ctx context.Context, assessmentID uuid.UUID, results []entity.AssessmentResult) error
}
