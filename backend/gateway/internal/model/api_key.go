package model

import (
	"time"

	"github.com/google/uuid"
)

type APIKey struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Provider    string     `json:"provider"`
	KeyValue    string     `json:"key_value"`
	Description *string    `json:"description"`
	IsActive    bool       `json:"is_active"`
	CreatedBy   *uuid.UUID `json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// APIKeyResponse masks the key value — only shows first 8 and last 4 chars.
type APIKeyResponse struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Provider    string     `json:"provider"`
	KeyMasked   string     `json:"key_masked"`
	Description *string    `json:"description"`
	IsActive    bool       `json:"is_active"`
	CreatedBy   *uuid.UUID `json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (k *APIKey) ToResponse() APIKeyResponse {
	masked := maskKey(k.KeyValue)
	return APIKeyResponse{
		ID:          k.ID,
		Name:        k.Name,
		Provider:    k.Provider,
		KeyMasked:   masked,
		Description: k.Description,
		IsActive:    k.IsActive,
		CreatedBy:   k.CreatedBy,
		CreatedAt:   k.CreatedAt,
		UpdatedAt:   k.UpdatedAt,
	}
}

func maskKey(key string) string {
	if len(key) <= 12 {
		return "••••••••"
	}
	return key[:8] + "••••••••" + key[len(key)-4:]
}

type CreateAPIKeyRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=100"`
	Provider    string  `json:"provider" validate:"required,min=2,max=50"`
	KeyValue    string  `json:"key_value" validate:"required,min=8"`
	Description *string `json:"description"`
}

type UpdateAPIKeyRequest struct {
	Name        *string `json:"name" validate:"omitempty,min=2,max=100"`
	Provider    *string `json:"provider" validate:"omitempty,min=2,max=50"`
	KeyValue    *string `json:"key_value" validate:"omitempty,min=8"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
}
