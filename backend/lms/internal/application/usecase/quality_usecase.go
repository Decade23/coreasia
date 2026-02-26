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

type QualityUseCase struct {
	qualityRepo repository.QualityRepository
	userRepo    repository.UserRepository
	schemeRepo  repository.SchemeRepository
}

func NewQualityUseCase(qualityRepo repository.QualityRepository, userRepo repository.UserRepository, schemeRepo repository.SchemeRepository) *QualityUseCase {
	return &QualityUseCase{qualityRepo: qualityRepo, userRepo: userRepo, schemeRepo: schemeRepo}
}

func (uc *QualityUseCase) Stats(ctx context.Context) (*dto.QualityStatsResponse, error) {
	stats, err := uc.qualityRepo.Stats(ctx)
	if err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := &dto.QualityStatsResponse{}

	if v, ok := stats["total_assessments"].(int); ok {
		resp.TotalAssessments = v
	}
	if v, ok := stats["competent_count"].(int); ok {
		resp.CompetentCount = v
	}
	if v, ok := stats["not_competent_count"].(int); ok {
		resp.NotCompetentCount = v
	}
	if v, ok := stats["pass_rate"].(float64); ok {
		resp.PassRate = v
	}
	if v, ok := stats["pending_reviews"].(int); ok {
		resp.PendingReviews = v
	}

	if breakdown, ok := stats["scheme_breakdown"].([]map[string]interface{}); ok {
		for _, b := range breakdown {
			item := dto.SchemeBreakdownItem{}
			if v, ok := b["scheme_name"].(string); ok {
				item.SchemeName = v
			}
			if v, ok := b["total"].(int); ok {
				item.Total = v
			}
			if v, ok := b["competent"].(int); ok {
				item.Competent = v
			}
			if v, ok := b["pass_rate"].(float64); ok {
				item.PassRate = v
			}
			resp.SchemeBreakdown = append(resp.SchemeBreakdown, item)
		}
	}

	return resp, nil
}

func (uc *QualityUseCase) ListReviews(ctx context.Context, page, perPage int, status string) ([]dto.QualityReviewResponse, int, error) {
	reviews, total, err := uc.qualityRepo.FindAll(ctx, page, perPage, status)
	if err != nil {
		return nil, 0, apperr.NewInternal(err)
	}

	resp := make([]dto.QualityReviewResponse, len(reviews))
	for i, r := range reviews {
		resp[i] = uc.toQualityReviewResponse(ctx, &r)
	}

	return resp, total, nil
}

func (uc *QualityUseCase) UpdateReview(ctx context.Context, id uuid.UUID, reviewerID uuid.UUID, req dto.UpdateQualityReviewRequest) (*dto.QualityReviewResponse, error) {
	review, err := uc.qualityRepo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Review")
	}

	review.Status = req.Status
	review.ManagerNotes = req.ManagerNotes
	review.ReviewedBy = &reviewerID
	now := time.Now()
	review.ReviewedAt = &now

	if err := uc.qualityRepo.Update(ctx, review); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := uc.toQualityReviewResponse(ctx, review)
	return &resp, nil
}

func (uc *QualityUseCase) toQualityReviewResponse(ctx context.Context, r *entity.QualityReview) dto.QualityReviewResponse {
	resp := dto.QualityReviewResponse{
		ID:             r.ID.String(),
		AssesseeID:     r.AssesseeID.String(),
		AssessorID:     r.AssessorID.String(),
		SchemeID:       r.SchemeID.String(),
		Recommendation: r.Recommendation,
		AssessorNotes:  r.AssessorNotes,
		ManagerNotes:   r.ManagerNotes,
		Status:         r.Status,
		SubmittedAt:    r.SubmittedAt,
		ReviewedAt:     r.ReviewedAt,
	}

	// Enrich with user/scheme names
	if assessee, err := uc.userRepo.FindByID(ctx, r.AssesseeID); err == nil {
		resp.AssesseeName = assessee.FullName
	}
	if assessor, err := uc.userRepo.FindByID(ctx, r.AssessorID); err == nil {
		resp.AssessorName = assessor.FullName
	}
	if scheme, err := uc.schemeRepo.FindByID(ctx, r.SchemeID); err == nil {
		resp.SchemeName = scheme.Name
	}

	return resp
}
