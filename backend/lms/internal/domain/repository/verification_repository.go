package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type VerificationRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Verification, error)
	FindAll(ctx context.Context, page, perPage int, status string) ([]entity.Verification, int, error)
	CountByStatus(ctx context.Context) (map[string]int, error)
	Create(ctx context.Context, v *entity.Verification) error
	Update(ctx context.Context, v *entity.Verification) error
	AddDocument(ctx context.Context, doc *entity.VerificationDocument) error
}
