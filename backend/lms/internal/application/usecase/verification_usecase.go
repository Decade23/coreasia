package usecase

import (
	"context"
	"encoding/json"
	"time"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/domain/repository"
	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/google/uuid"
)

type VerificationUseCase struct {
	repo repository.VerificationRepository
}

func NewVerificationUseCase(repo repository.VerificationRepository) *VerificationUseCase {
	return &VerificationUseCase{repo: repo}
}

func (uc *VerificationUseCase) List(ctx context.Context, page, perPage int, status string) ([]dto.VerificationResponse, int, error) {
	verifications, total, err := uc.repo.FindAll(ctx, page, perPage, status)
	if err != nil {
		return nil, 0, apperr.NewInternal(err)
	}

	resp := make([]dto.VerificationResponse, len(verifications))
	for i, v := range verifications {
		resp[i] = toVerificationResponse(&v)
	}
	return resp, total, nil
}

func (uc *VerificationUseCase) GetByID(ctx context.Context, id uuid.UUID) (*dto.VerificationResponse, error) {
	v, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Verifikasi")
	}
	resp := toVerificationResponse(v)
	return &resp, nil
}

func (uc *VerificationUseCase) Summary(ctx context.Context) (*dto.VerificationSummaryResponse, error) {
	counts, err := uc.repo.CountByStatus(ctx)
	if err != nil {
		return nil, apperr.NewInternal(err)
	}

	total := 0
	for _, c := range counts {
		total += c
	}

	return &dto.VerificationSummaryResponse{
		Draft:          counts["DRAFT"],
		Submitted:      counts["SUBMITTED"],
		UnderReview:    counts["UNDER_REVIEW"],
		RevisionNeeded: counts["REVISION_NEEDED"],
		Verified:       counts["VERIFIED"],
		Rejected:       counts["REJECTED"],
		Total:          total,
	}, nil
}

func (uc *VerificationUseCase) UpdateStatus(ctx context.Context, id uuid.UUID, reviewerID uuid.UUID, req dto.UpdateVerificationRequest) (*dto.VerificationResponse, error) {
	v, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, apperr.NewNotFound("Verifikasi")
	}

	v.Status = req.Status
	v.ReviewNotes = req.ReviewNotes
	v.ReviewedBy = &reviewerID
	now := time.Now()
	v.ReviewedAt = &now

	if err := uc.repo.Update(ctx, v); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := toVerificationResponse(v)
	return &resp, nil
}

func toVerificationResponse(v *entity.Verification) dto.VerificationResponse {
	resp := dto.VerificationResponse{
		ID:          v.ID.String(),
		AssesseeID:  v.AssesseeID.String(),
		SchemeID:    v.SchemeID.String(),
		Status:      v.Status,
		ReviewNotes: v.ReviewNotes,
		SubmittedAt: v.SubmittedAt,
		ReviewedAt:  v.ReviewedAt,
		CreatedAt:   v.CreatedAt,
		UpdatedAt:   v.UpdatedAt,
	}

	if v.ReviewedBy != nil {
		s := v.ReviewedBy.String()
		resp.ReviewedBy = &s
	}

	var personalData interface{}
	if err := json.Unmarshal(v.PersonalData, &personalData); err == nil {
		resp.PersonalData = personalData
	}

	for _, d := range v.Documents {
		resp.Documents = append(resp.Documents, dto.VerificationDocResponse{
			ID:           d.ID.String(),
			Name:         d.Name,
			DocumentType: d.DocumentType,
			FileURL:      d.FileURL,
			FileSize:     d.FileSize,
			UploadedAt:   d.UploadedAt,
		})
	}

	if v.Assessee != nil {
		userResp := toUserResponse(v.Assessee)
		resp.Assessee = &userResp
	}

	return resp
}
