package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/domain/repository"
	"github.com/coreasia/lms-api/internal/domain/valueobject"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type RegistrationUseCase struct {
	userRepo         repository.UserRepository
	schemeRepo       repository.SchemeRepository
	verificationRepo repository.VerificationRepository
	auditRepo        repository.AuditLogRepository
}

func NewRegistrationUseCase(
	userRepo repository.UserRepository,
	schemeRepo repository.SchemeRepository,
	verificationRepo repository.VerificationRepository,
	auditRepo repository.AuditLogRepository,
) *RegistrationUseCase {
	return &RegistrationUseCase{
		userRepo:         userRepo,
		schemeRepo:       schemeRepo,
		verificationRepo: verificationRepo,
		auditRepo:        auditRepo,
	}
}

func (uc *RegistrationUseCase) Submit(ctx context.Context, req dto.SubmitRegistrationRequest, ipAddress string) (*dto.SubmitRegistrationResponse, error) {
	schemeID, err := uc.resolveSchemeID(ctx, req.SchemeID)
	if err != nil {
		return nil, err
	}

	assessee, err := uc.findOrCreateAssessee(ctx, req)
	if err != nil {
		return nil, err
	}

	personalData, err := json.Marshal(req)
	if err != nil {
		return nil, apperr.NewInternal(fmt.Errorf("marshal registration payload: %w", err))
	}

	now := time.Now()
	verification := &entity.Verification{
		ID:           uuid.New(),
		AssesseeID:   assessee.ID,
		SchemeID:     schemeID,
		Status:       "SUBMITTED",
		PersonalData: personalData,
		SubmittedAt:  &now,
	}

	if err := uc.verificationRepo.Create(ctx, verification); err != nil {
		return nil, apperr.NewInternal(fmt.Errorf("membuat verifikasi pendaftaran: %w", err))
	}

	if err := uc.writeAudit(ctx, verification, assessee, ipAddress); err != nil {
		return nil, err
	}

	return &dto.SubmitRegistrationResponse{
		VerificationID: verification.ID.String(),
		AssesseeID:     assessee.ID.String(),
		SchemeID:       schemeID.String(),
		Status:         verification.Status,
	}, nil
}

func (uc *RegistrationUseCase) resolveSchemeID(ctx context.Context, raw string) (uuid.UUID, error) {
	if id, err := uuid.Parse(raw); err == nil {
		if _, err := uc.schemeRepo.FindByID(ctx, id); err == nil {
			return id, nil
		}
	}

	schemes, _, err := uc.schemeRepo.FindAll(ctx, 1, 20, raw)
	if err != nil {
		return uuid.Nil, apperr.NewInternal(fmt.Errorf("mencari skema: %w", err))
	}

	for _, scheme := range schemes {
		if strings.EqualFold(scheme.Code, raw) || strings.EqualFold(scheme.Name, raw) {
			return scheme.ID, nil
		}
	}

	if len(schemes) == 1 {
		return schemes[0].ID, nil
	}

	return uuid.Nil, apperr.NewNotFound("Skema")
}

func (uc *RegistrationUseCase) findOrCreateAssessee(ctx context.Context, req dto.SubmitRegistrationRequest) (*entity.User, error) {
	if existing, err := uc.userRepo.FindByEmail(ctx, req.Email); err == nil && existing != nil {
		if existing.Role != valueobject.RoleAssessee {
			return nil, apperr.NewConflict("Email sudah digunakan oleh role lain")
		}
		return existing, nil
	}

	tempPassword := uuid.NewString()
	hash, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperr.NewInternal(fmt.Errorf("hash password pendaftaran: %w", err))
	}

	phone := req.PhoneNumber
	user := &entity.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		PhoneNumber:  &phone,
		Role:         valueobject.RoleAssessee,
		IsActive:     true,
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, apperr.NewInternal(fmt.Errorf("membuat user pendaftar: %w", err))
	}

	return user, nil
}

func (uc *RegistrationUseCase) writeAudit(ctx context.Context, verification *entity.Verification, assessee *entity.User, ipAddress string) error {
	userID := assessee.ID
	userName := assessee.FullName
	userRole := assessee.Role
	resourceID := verification.ID.String()
	description := fmt.Sprintf("Pendaftaran APL-01 dikirim oleh %s untuk skema %s", assessee.Email, verification.SchemeID.String())
	ip := ipAddress

	if err := uc.auditRepo.Create(ctx, &entity.AuditLog{
		UserID:      &userID,
		UserName:    &userName,
		UserRole:    &userRole,
		Action:      "submit",
		Resource:    "registrations",
		ResourceID:  &resourceID,
		Description: &description,
		IPAddress:   &ip,
	}); err != nil {
		return apperr.NewInternal(fmt.Errorf("mencatat audit pendaftaran: %w", err))
	}

	return nil
}
