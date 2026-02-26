package repository

import (
	"context"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/google/uuid"
)

type ScheduleRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*entity.Schedule, error)
	FindAll(ctx context.Context, page, perPage int, status string) ([]entity.Schedule, int, error)
	Create(ctx context.Context, schedule *entity.Schedule) error
	Update(ctx context.Context, schedule *entity.Schedule) error
	Delete(ctx context.Context, id uuid.UUID) error
	AssignAssessor(ctx context.Context, scheduleID, assessorID uuid.UUID) error
	RemoveAssessor(ctx context.Context, scheduleID, assessorID uuid.UUID) error
}
