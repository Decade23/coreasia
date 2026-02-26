package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type QuestionRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Question, error)
	FindAll(ctx context.Context, page, perPage int, schemeID *uuid.UUID, questionType, difficulty string) ([]entity.Question, int, error)
	Create(ctx context.Context, question *entity.Question) error
	Update(ctx context.Context, question *entity.Question) error
	Delete(ctx context.Context, id uuid.UUID) error
}
