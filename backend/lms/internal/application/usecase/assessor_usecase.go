package usecase

import (
	"context"
	"fmt"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/domain/repository"
	"github.com/coreasia/lms-api/internal/domain/valueobject"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AssessorUseCase struct {
	assessorRepo repository.AssessorRepository
	userRepo     repository.UserRepository
}

func NewAssessorUseCase(assessorRepo repository.AssessorRepository, userRepo repository.UserRepository) *AssessorUseCase {
	return &AssessorUseCase{assessorRepo: assessorRepo, userRepo: userRepo}
}

func (uc *AssessorUseCase) List(ctx context.Context, page, perPage int, search string) ([]dto.AssessorResponse, int, error) {
	profiles, total, err := uc.assessorRepo.FindAll(ctx, page, perPage, search)
	if err != nil {
		return nil, 0, apperr.NewInternal(err)
	}

	resp := make([]dto.AssessorResponse, len(profiles))
	for i, p := range profiles {
		resp[i] = toAssessorResponse(&p)
	}
	return resp, total, nil
}

func (uc *AssessorUseCase) GetByID(ctx context.Context, userID uuid.UUID) (*dto.AssessorResponse, error) {
	profile, err := uc.assessorRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, apperr.NewNotFound("Asesor")
	}
	resp := toAssessorResponse(profile)
	return &resp, nil
}

func (uc *AssessorUseCase) Create(ctx context.Context, req dto.CreateAssessorRequest) (*dto.AssessorResponse, error) {
	existing, _ := uc.userRepo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, apperr.NewConflict("Email sudah terdaftar")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperr.NewInternal(fmt.Errorf("hash password: %w", err))
	}

	user := &entity.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		PhoneNumber:  req.PhoneNumber,
		Role:         valueobject.RoleAssessor,
		IsActive:     true,
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, apperr.NewInternal(err)
	}

	profile := &entity.AssessorProfile{
		UserID:          user.ID,
		Specialization:  req.Specialization,
		LicenseNumber:   req.LicenseNumber,
		LicenseIssuedBy: req.LicenseIssuedBy,
		LicenseStatus:   "active",
		User:            user,
	}

	if err := uc.assessorRepo.Create(ctx, profile); err != nil {
		return nil, apperr.NewInternal(err)
	}

	for _, sid := range req.SchemeIDs {
		schemeID, err := uuid.Parse(sid)
		if err != nil {
			continue
		}
		_ = uc.assessorRepo.AssignScheme(ctx, user.ID, schemeID)
	}

	full, _ := uc.assessorRepo.FindByUserID(ctx, user.ID)
	if full != nil {
		resp := toAssessorResponse(full)
		return &resp, nil
	}

	resp := toAssessorResponse(profile)
	return &resp, nil
}

func (uc *AssessorUseCase) Update(ctx context.Context, userID uuid.UUID, req dto.UpdateAssessorRequest) (*dto.AssessorResponse, error) {
	profile, err := uc.assessorRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, apperr.NewNotFound("Asesor")
	}

	if req.FullName != nil && profile.User != nil {
		profile.User.FullName = *req.FullName
		_ = uc.userRepo.Update(ctx, profile.User)
	}
	if req.Specialization != nil {
		profile.Specialization = req.Specialization
	}
	if req.LicenseNumber != nil {
		profile.LicenseNumber = req.LicenseNumber
	}
	if req.LicenseIssuedBy != nil {
		profile.LicenseIssuedBy = req.LicenseIssuedBy
	}
	if req.LicenseStatus != nil {
		profile.LicenseStatus = *req.LicenseStatus
	}

	if err := uc.assessorRepo.Update(ctx, profile); err != nil {
		return nil, apperr.NewInternal(err)
	}

	resp := toAssessorResponse(profile)
	return &resp, nil
}

func toAssessorResponse(p *entity.AssessorProfile) dto.AssessorResponse {
	resp := dto.AssessorResponse{
		UserID:          p.UserID.String(),
		Specialization:  p.Specialization,
		LicenseNumber:   p.LicenseNumber,
		LicenseIssuedBy: p.LicenseIssuedBy,
		LicenseIssuedAt: p.LicenseIssuedAt,
		LicenseExpiryAt: p.LicenseExpiryAt,
		LicenseStatus:   p.LicenseStatus,
	}

	if p.User != nil {
		resp.Email = p.User.Email
		resp.FullName = p.User.FullName
		resp.PhoneNumber = p.User.PhoneNumber
	}

	for _, s := range p.Schemes {
		resp.Schemes = append(resp.Schemes, dto.SchemeResponse{
			ID:   s.ID.String(),
			Code: s.Code,
			Name: s.Name,
		})
	}

	return resp
}
