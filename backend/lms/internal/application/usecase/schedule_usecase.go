package usecase

import (
	"context"
	"time"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/domain/repository"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/google/uuid"
)

type ScheduleUseCase struct {
	repo repository.ScheduleRepository
}

func NewScheduleUseCase(repo repository.ScheduleRepository) *ScheduleUseCase {
	return &ScheduleUseCase{repo: repo}
}

func (uc *ScheduleUseCase) List(ctx context.Context, page, perPage int, status string) ([]dto.ScheduleResponse, int, error) {
	schedules, total, err := uc.repo.FindAll(ctx, page, perPage, status)
	if err != nil {
		return nil, 0, apperr.NewInternal(err)
	}

	resp := make([]dto.ScheduleResponse, len(schedules))
	for i, s := range schedules {
		resp[i] = toScheduleResponse(&s)
	}
	return resp, total, nil
}

func (uc *ScheduleUseCase) GetByID(ctx context.Context, id uuid.UUID) (*dto.ScheduleResponse, error) {
	schedule, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Jadwal")
	}
	resp := toScheduleResponse(schedule)
	return &resp, nil
}

func (uc *ScheduleUseCase) Create(ctx context.Context, req dto.CreateScheduleRequest) (*dto.ScheduleResponse, error) {
	schemeID, err := uuid.Parse(req.SchemeID)
	if err != nil {
		return nil, apperr.NewBadRequest("Scheme ID tidak valid")
	}

	startDate, err := time.Parse(time.RFC3339, req.StartDate)
	if err != nil {
		return nil, apperr.NewBadRequest("Format start_date tidak valid (gunakan RFC3339)")
	}
	endDate, err := time.Parse(time.RFC3339, req.EndDate)
	if err != nil {
		return nil, apperr.NewBadRequest("Format end_date tidak valid (gunakan RFC3339)")
	}

	if endDate.Before(startDate) {
		return nil, apperr.NewBadRequest("end_date harus setelah start_date")
	}

	schedule := &entity.Schedule{
		ID:              uuid.New(),
		Title:           req.Title,
		SchemeID:        schemeID,
		ScheduleType:    req.ScheduleType,
		Status:          "draft",
		StartDate:       startDate,
		EndDate:         endDate,
		Location:        req.Location,
		MaxParticipants: req.MaxParticipants,
	}

	for _, aid := range req.AssessorIDs {
		assessorID, err := uuid.Parse(aid)
		if err != nil {
			continue
		}
		schedule.Assessors = append(schedule.Assessors, entity.User{ID: assessorID})
	}

	if err := uc.repo.Create(ctx, schedule); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := toScheduleResponse(schedule)
	return &resp, nil
}

func (uc *ScheduleUseCase) Update(ctx context.Context, id uuid.UUID, req dto.UpdateScheduleRequest) (*dto.ScheduleResponse, error) {
	schedule, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Jadwal")
	}

	if req.Title != nil {
		schedule.Title = *req.Title
	}
	if req.ScheduleType != nil {
		schedule.ScheduleType = *req.ScheduleType
	}
	if req.Status != nil {
		schedule.Status = *req.Status
	}
	if req.StartDate != nil {
		t, err := time.Parse(time.RFC3339, *req.StartDate)
		if err == nil {
			schedule.StartDate = t
		}
	}
	if req.EndDate != nil {
		t, err := time.Parse(time.RFC3339, *req.EndDate)
		if err == nil {
			schedule.EndDate = t
		}
	}
	if req.Location != nil {
		schedule.Location = req.Location
	}
	if req.MaxParticipants != nil {
		schedule.MaxParticipants = *req.MaxParticipants
	}

	if err := uc.repo.Update(ctx, schedule); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := toScheduleResponse(schedule)
	return &resp, nil
}

func (uc *ScheduleUseCase) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := uc.repo.FindByID(ctx, id); err != nil {
		return apperr.NewNotFound("Jadwal")
	}
	if err := uc.repo.Delete(ctx, id); err != nil {
		return apperr.NewInternal(err)
	}
	return nil
}

func toScheduleResponse(s *entity.Schedule) dto.ScheduleResponse {
	resp := dto.ScheduleResponse{
		ID:              s.ID.String(),
		Title:           s.Title,
		SchemeID:        s.SchemeID.String(),
		ScheduleType:    s.ScheduleType,
		Status:          s.Status,
		StartDate:       s.StartDate,
		EndDate:         s.EndDate,
		Location:        s.Location,
		MaxParticipants: s.MaxParticipants,
		CreatedAt:       s.CreatedAt,
		UpdatedAt:       s.UpdatedAt,
	}

	for _, a := range s.Assessors {
		resp.Assessors = append(resp.Assessors, toUserResponse(&a))
	}

	return resp
}
