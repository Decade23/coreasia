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

type AssessmentUseCase struct {
	assessmentRepo repository.AssessmentRepository
	schemeRepo     repository.SchemeRepository
}

func NewAssessmentUseCase(assessmentRepo repository.AssessmentRepository, schemeRepo repository.SchemeRepository) *AssessmentUseCase {
	return &AssessmentUseCase{assessmentRepo: assessmentRepo, schemeRepo: schemeRepo}
}

func (uc *AssessmentUseCase) GetUnits(ctx context.Context, schemeID uuid.UUID) ([]dto.AssessmentUnitResponse, error) {
	scheme, err := uc.schemeRepo.FindByID(ctx, schemeID)
	if err != nil {
		return nil, apperr.NewNotFound("Skema")
	}

	var units []dto.AssessmentUnitResponse
	for _, u := range scheme.Units {
		unit := dto.AssessmentUnitResponse{
			ID:    u.ID.String(),
			Code:  u.Code,
			Title: u.Title,
		}

		for _, e := range u.Elements {
			elem := dto.AssessmentElementResponse{
				ID:    e.ID.String(),
				Title: e.Title,
			}

			for _, c := range e.Criteria {
				elem.Criteria = append(elem.Criteria, dto.AssessmentCriteriaResponse{
					ID:     c.ID.String(),
					Text:   c.Text,
					Status: nil,
				})
			}
			unit.Elements = append(unit.Elements, elem)
		}
		units = append(units, unit)
	}

	return units, nil
}

func (uc *AssessmentUseCase) SubmitReview(ctx context.Context, id uuid.UUID, assessorID uuid.UUID, req dto.SubmitAssessmentRequest) (*dto.AssessmentResponse, error) {
	assessment, err := uc.assessmentRepo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Asesmen")
	}

	assessment.Recommendation = &req.Recommendation
	assessment.AssessorNotes = req.AssessorNotes
	assessment.Status = "submitted"
	now := time.Now()
	assessment.SubmittedAt = &now

	if err := uc.assessmentRepo.Update(ctx, assessment); err != nil {
		return nil, apperr.NewInternal(err)
	}

	// Save individual results
	var results []entity.AssessmentResult
	for _, r := range req.Results {
		criteriaID, err := uuid.Parse(r.CriteriaID)
		if err != nil {
			continue
		}
		res := entity.AssessmentResult{
			ID:           uuid.New(),
			AssessmentID: id,
			CriteriaID:   criteriaID,
			Status:       r.Status,
		}
		if r.EvidenceID != nil {
			eid, err := uuid.Parse(*r.EvidenceID)
			if err == nil {
				res.EvidenceID = &eid
			}
		}
		results = append(results, res)
	}

	if len(results) > 0 {
		if err := uc.assessmentRepo.SaveResults(ctx, id, results); err != nil {
			return nil, apperr.NewInternal(err)
		}
	}

	resp := toAssessmentResponse(assessment)
	return &resp, nil
}

func toAssessmentResponse(a *entity.Assessment) dto.AssessmentResponse {
	resp := dto.AssessmentResponse{
		ID:             a.ID.String(),
		AssesseeID:     a.AssesseeID.String(),
		AssessorID:     a.AssessorID.String(),
		SchemeID:       a.SchemeID.String(),
		Recommendation: a.Recommendation,
		AssessorNotes:  a.AssessorNotes,
		Status:         a.Status,
		SubmittedAt:    a.SubmittedAt,
		CreatedAt:      a.CreatedAt,
	}

	for _, r := range a.Results {
		rr := dto.AssessmentResultResponse{
			ID:         r.ID.String(),
			CriteriaID: r.CriteriaID.String(),
			Status:     r.Status,
		}
		if r.EvidenceID != nil {
			s := r.EvidenceID.String()
			rr.EvidenceID = &s
		}
		resp.Results = append(resp.Results, rr)
	}

	return resp
}
