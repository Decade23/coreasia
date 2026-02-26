package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type AssessorRepository interface {
	FindByUserID(ctx context.Context, userID uuid.UUID) (*entity.AssessorProfile, error)
	FindAll(ctx context.Context, page, perPage int, search string) ([]entity.AssessorProfile, int, error)
	Create(ctx context.Context, profile *entity.AssessorProfile) error
	Update(ctx context.Context, profile *entity.AssessorProfile) error
	AssignScheme(ctx context.Context, assessorID, schemeID uuid.UUID) error
	RemoveScheme(ctx context.Context, assessorID, schemeID uuid.UUID) error
}
