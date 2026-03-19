package auth

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	jwt.RegisteredClaims
	UserID   uuid.UUID `json:"user_id"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	FullName string    `json:"full_name"`
}
