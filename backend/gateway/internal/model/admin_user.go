package model

import (
	"time"

	"github.com/google/uuid"
)

type AdminUser struct {
	ID          uuid.UUID  `json:"id"`
	Email       string     `json:"email"`
	PasswordHash string   `json:"-"`
	FullName    string     `json:"full_name"`
	Role        string     `json:"role"`
	IsActive    bool       `json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type AdminUserResponse struct {
	ID        uuid.UUID  `json:"id"`
	Email     string     `json:"email"`
	FullName  string     `json:"full_name"`
	Role      string     `json:"role"`
	IsActive  bool       `json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt time.Time  `json:"created_at"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type LoginResponse struct {
	AccessToken  string            `json:"access_token"`
	RefreshToken string            `json:"refresh_token"`
	ExpiresAt    time.Time         `json:"expires_at"`
	User         AdminUserResponse `json:"user"`
}

type CreateAdminRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,password_strength"`
	FullName string `json:"full_name" validate:"required,min=2"`
	Role     string `json:"role" validate:"required,oneof=admin super_admin"`
}

type UpdateAdminRequest struct {
	Email    *string `json:"email" validate:"omitempty,email"`
	FullName *string `json:"full_name" validate:"omitempty,min=2"`
	Role     *string `json:"role" validate:"omitempty,oneof=admin super_admin"`
	IsActive *bool   `json:"is_active"`
	Password *string `json:"password" validate:"omitempty,password_strength"`
}

func (u *AdminUser) ToResponse() AdminUserResponse {
	return AdminUserResponse{
		ID:          u.ID,
		Email:       u.Email,
		FullName:    u.FullName,
		Role:        u.Role,
		IsActive:    u.IsActive,
		LastLoginAt: u.LastLoginAt,
		CreatedAt:   u.CreatedAt,
	}
}
