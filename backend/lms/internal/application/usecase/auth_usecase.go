package usecase

import (
	"context"
	"fmt"

	"github.com/coreasia/lms-api/internal/application/dto"
	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/domain/repository"
	"github.com/coreasia/lms-api/internal/domain/valueobject"
	"github.com/coreasia/lms-api/internal/infrastructure/auth"
	"github.com/coreasia/lms-api/pkg/apperr"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthUseCase struct {
	userRepo repository.UserRepository
	jwt      *auth.JWTProvider
}

func NewAuthUseCase(userRepo repository.UserRepository, jwt *auth.JWTProvider) *AuthUseCase {
	return &AuthUseCase{userRepo: userRepo, jwt: jwt}
}

func (uc *AuthUseCase) Login(ctx context.Context, req dto.LoginRequest, tenantID string) (*dto.LoginResponse, error) {
	user, err := uc.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, apperr.NewUnauthorized("Email atau kata sandi salah")
	}

	if !user.IsActive {
		return nil, apperr.NewForbidden("Akun telah dinonaktifkan")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, apperr.NewUnauthorized("Email atau kata sandi salah")
	}

	tokenPair, err := uc.jwt.GenerateTokenPair(user, tenantID)
	if err != nil {
		return nil, apperr.NewInternal(fmt.Errorf("gagal generate token: %w", err))
	}

	_ = uc.userRepo.UpdateLastLogin(ctx, user.ID)

	return &dto.LoginResponse{
		User:         toUserResponse(user),
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresAt:    tokenPair.ExpiresAt,
	}, nil
}

func (uc *AuthUseCase) Register(ctx context.Context, req dto.RegisterRequest) (*dto.UserResponse, error) {
	existing, _ := uc.userRepo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, apperr.NewConflict("Email sudah terdaftar")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperr.NewInternal(fmt.Errorf("gagal hash password: %w", err))
	}

	user := &entity.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Role:         valueobject.RoleAssessee,
		IsActive:     true,
	}

	if req.PhoneNumber != "" {
		user.PhoneNumber = &req.PhoneNumber
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, apperr.NewInternal(fmt.Errorf("gagal membuat user: %w", err))
	}

	resp := toUserResponse(user)
	return &resp, nil
}

func (uc *AuthUseCase) GetCurrentUser(ctx context.Context, userID uuid.UUID) (*dto.UserResponse, error) {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, apperr.NewNotFound("User")
	}

	resp := toUserResponse(user)
	return &resp, nil
}

func (uc *AuthUseCase) RefreshToken(ctx context.Context, refreshTokenStr, tenantID string) (*dto.TokenResponse, error) {
	userID, err := uc.jwt.ValidateRefreshToken(refreshTokenStr)
	if err != nil {
		return nil, apperr.NewUnauthorized("Refresh token tidak valid")
	}

	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, apperr.NewNotFound("User")
	}

	tokenPair, err := uc.jwt.GenerateTokenPair(user, tenantID)
	if err != nil {
		return nil, apperr.NewInternal(fmt.Errorf("gagal generate token: %w", err))
	}

	return &dto.TokenResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresAt:    tokenPair.ExpiresAt,
	}, nil
}

func toUserResponse(u *entity.User) dto.UserResponse {
	return dto.UserResponse{
		ID:          u.ID.String(),
		Email:       u.Email,
		FullName:    u.FullName,
		PhoneNumber: u.PhoneNumber,
		Role:        u.Role,
		IsActive:    u.IsActive,
		LastLoginAt: u.LastLoginAt,
		CreatedAt:   u.CreatedAt,
		UpdatedAt:   u.UpdatedAt,
	}
}
