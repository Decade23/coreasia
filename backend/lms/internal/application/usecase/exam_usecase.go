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

type ExamUseCase struct {
	examRepo     repository.ExamRepository
	questionRepo repository.QuestionRepository
	schemeRepo   repository.SchemeRepository
}

func NewExamUseCase(examRepo repository.ExamRepository, questionRepo repository.QuestionRepository, schemeRepo repository.SchemeRepository) *ExamUseCase {
	return &ExamUseCase{examRepo: examRepo, questionRepo: questionRepo, schemeRepo: schemeRepo}
}

func (uc *ExamUseCase) GetExam(ctx context.Context, id uuid.UUID) (*dto.ExamResponse, error) {
	exam, err := uc.examRepo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Ujian")
	}

	scheme, _ := uc.schemeRepo.FindByID(ctx, exam.SchemeID)
	schemeID := exam.SchemeID
	questions, _, _ := uc.questionRepo.FindAll(ctx, 1, 100, &schemeID, "", "")

	resp := &dto.ExamResponse{
		ID:              exam.ID.String(),
		SchemeID:        exam.SchemeID.String(),
		DurationMinutes: 60,
		PassingScore:    70,
		Status:          exam.Status,
		StartedAt:       exam.StartedAt,
		SubmittedAt:     exam.SubmittedAt,
		Score:           exam.Score,
	}

	if scheme != nil {
		resp.Title = scheme.Name
	}

	for _, q := range questions {
		qr := dto.ExamQuestionResponse{
			ID:           q.ID.String(),
			QuestionType: q.QuestionType,
			QuestionText: q.QuestionText,
			Points:       q.Points,
			IsRequired:   true,
		}

		for _, o := range q.Options {
			qr.Options = append(qr.Options, dto.ExamOptionResponse{
				ID:    o.ID.String(),
				Label: o.Text,
				Value: o.Text,
			})
		}
		resp.Questions = append(resp.Questions, qr)
	}

	return resp, nil
}

func (uc *ExamUseCase) SubmitExam(ctx context.Context, req dto.SubmitExamRequest) (*dto.SubmitExamResponse, error) {
	examID, err := uuid.Parse(req.ExamID)
	if err != nil {
		return nil, apperr.NewBadRequest("Exam ID tidak valid")
	}

	exam, err := uc.examRepo.FindByID(ctx, examID)
	if err != nil {
		return nil, apperr.NewNotFound("Ujian")
	}

	if exam.Status == "submitted" || exam.Status == "graded" {
		return nil, apperr.NewBadRequest("Ujian sudah diselesaikan")
	}

	// Save answers
	var answers []entity.ExamAnswer
	for qID, answerText := range req.Answers {
		questionID, err := uuid.Parse(qID)
		if err != nil {
			continue
		}
		text := answerText
		answers = append(answers, entity.ExamAnswer{
			ID:         uuid.New(),
			ExamID:     examID,
			QuestionID: questionID,
			AnswerText: &text,
		})
	}

	if len(answers) > 0 {
		if err := uc.examRepo.SaveAnswers(ctx, examID, answers); err != nil {
			return nil, apperr.NewInternal(err)
		}
	}

	if err := uc.examRepo.SubmitExam(ctx, examID); err != nil {
		return nil, apperr.NewInternal(err)
	}

	return &dto.SubmitExamResponse{
		ExamID:      examID.String(),
		SubmittedAt: time.Now(),
		Status:      "submitted",
	}, nil
}

func (uc *ExamUseCase) SyncAnswers(ctx context.Context, req dto.SyncAnswersRequest) (*dto.SyncAnswersResponse, error) {
	examID, err := uuid.Parse(req.ExamID)
	if err != nil {
		return nil, apperr.NewBadRequest("Exam ID tidak valid")
	}

	var answers []entity.ExamAnswer
	for qID, answerText := range req.Answers {
		questionID, err := uuid.Parse(qID)
		if err != nil {
			continue
		}
		text := answerText
		answers = append(answers, entity.ExamAnswer{
			ID:         uuid.New(),
			ExamID:     examID,
			QuestionID: questionID,
			AnswerText: &text,
		})
	}

	if len(answers) > 0 {
		if err := uc.examRepo.SaveAnswers(ctx, examID, answers); err != nil {
			return nil, apperr.NewInternal(err)
		}
	}

	return &dto.SyncAnswersResponse{
		Success:  true,
		SyncedAt: time.Now(),
	}, nil
}
