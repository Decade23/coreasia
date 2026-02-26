package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type ExamRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Exam, error)
	FindByAssessee(ctx context.Context, assesseeID uuid.UUID) ([]entity.Exam, error)
	Create(ctx context.Context, exam *entity.Exam) error
	Update(ctx context.Context, exam *entity.Exam) error
	SaveAnswers(ctx context.Context, examID uuid.UUID, answers []entity.ExamAnswer) error
	SubmitExam(ctx context.Context, examID uuid.UUID) error
}
