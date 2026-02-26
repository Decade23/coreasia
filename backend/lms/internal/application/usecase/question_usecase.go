package usecase

import (
	"context"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/domain/repository"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/google/uuid"
)

type QuestionUseCase struct {
	repo repository.QuestionRepository
}

func NewQuestionUseCase(repo repository.QuestionRepository) *QuestionUseCase {
	return &QuestionUseCase{repo: repo}
}

func (uc *QuestionUseCase) List(ctx context.Context, page, perPage int, schemeID *uuid.UUID, questionType, difficulty string) ([]dto.QuestionResponse, int, error) {
	questions, total, err := uc.repo.FindAll(ctx, page, perPage, schemeID, questionType, difficulty)
	if err != nil {
		return nil, 0, apperr.NewInternal(err)
	}

	resp := make([]dto.QuestionResponse, len(questions))
	for i, q := range questions {
		resp[i] = toQuestionResponse(&q)
	}
	return resp, total, nil
}

func (uc *QuestionUseCase) GetByID(ctx context.Context, id uuid.UUID) (*dto.QuestionResponse, error) {
	question, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Soal")
	}
	resp := toQuestionResponse(question)
	return &resp, nil
}

func (uc *QuestionUseCase) Create(ctx context.Context, req dto.CreateQuestionRequest) (*dto.QuestionResponse, error) {
	schemeID, err := uuid.Parse(req.SchemeID)
	if err != nil {
		return nil, apperr.NewBadRequest("Scheme ID tidak valid")
	}

	question := &entity.Question{
		ID:           uuid.New(),
		SchemeID:     schemeID,
		QuestionType: req.QuestionType,
		QuestionText: req.QuestionText,
		Difficulty:   req.Difficulty,
		Points:       req.Points,
		IsActive:     true,
		Rubric:       req.Rubric,
		Instructions: req.Instructions,
	}

	for i, o := range req.Options {
		opt := entity.QuestionOption{
			ID:        uuid.New(),
			Text:      o.Text,
			IsCorrect: o.IsCorrect,
			SortOrder: i,
		}
		if o.SortOrder > 0 {
			opt.SortOrder = o.SortOrder
		}
		question.Options = append(question.Options, opt)
	}

	if err := uc.repo.Create(ctx, question); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := toQuestionResponse(question)
	return &resp, nil
}

func (uc *QuestionUseCase) Update(ctx context.Context, id uuid.UUID, req dto.UpdateQuestionRequest) (*dto.QuestionResponse, error) {
	question, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Soal")
	}

	if req.QuestionType != nil {
		question.QuestionType = *req.QuestionType
	}
	if req.QuestionText != nil {
		question.QuestionText = *req.QuestionText
	}
	if req.Difficulty != nil {
		question.Difficulty = *req.Difficulty
	}
	if req.Points != nil {
		question.Points = *req.Points
	}
	if req.IsActive != nil {
		question.IsActive = *req.IsActive
	}
	if req.Rubric != nil {
		question.Rubric = req.Rubric
	}
	if req.Instructions != nil {
		question.Instructions = req.Instructions
	}

	if err := uc.repo.Update(ctx, question); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := toQuestionResponse(question)
	return &resp, nil
}

func (uc *QuestionUseCase) Delete(ctx context.Context, id uuid.UUID) error {
	if _, err := uc.repo.FindByID(ctx, id); err != nil {
		return apperr.NewNotFound("Soal")
	}
	if err := uc.repo.Delete(ctx, id); err != nil {
		return apperr.NewInternal(err)
	}
	return nil
}

func toQuestionResponse(q *entity.Question) dto.QuestionResponse {
	resp := dto.QuestionResponse{
		ID:           q.ID.String(),
		SchemeID:     q.SchemeID.String(),
		QuestionType: q.QuestionType,
		QuestionText: q.QuestionText,
		Difficulty:   q.Difficulty,
		Points:       q.Points,
		IsActive:     q.IsActive,
		Rubric:       q.Rubric,
		Instructions: q.Instructions,
		CreatedAt:    q.CreatedAt,
		UpdatedAt:    q.UpdatedAt,
	}

	for _, o := range q.Options {
		resp.Options = append(resp.Options, dto.OptionResponse{
			ID:        o.ID.String(),
			Text:      o.Text,
			IsCorrect: o.IsCorrect,
			SortOrder: o.SortOrder,
		})
	}

	return resp
}
