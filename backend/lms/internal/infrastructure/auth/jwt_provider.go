package auth

import (
	"fmt"
	"time"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/infrastructure"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	jwt.RegisteredClaims
	UserID   uuid.UUID `json:"user_id"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	FullName string    `json:"full_name"`
	TenantID string    `json:"tenant_id"`
}

type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

type JWTProvider struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
	issuer     string
}

func NewJWTProvider(cfg infrastructure.JWTConfig) *JWTProvider {
	return &JWTProvider{
		secret:     []byte(cfg.Secret),
		accessTTL:  cfg.AccessTTL,
		refreshTTL: cfg.RefreshTTL,
		issuer:     cfg.Issuer,
	}
}

func (p *JWTProvider) GenerateTokenPair(user *entity.User, tenantID string) (*TokenPair, error) {
	now := time.Now()
	expiresAt := now.Add(p.accessTTL)

	accessClaims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    p.issuer,
			Subject:   user.ID.String(),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        uuid.New().String(),
		},
		UserID:   user.ID,
		Email:    user.Email,
		Role:     user.Role,
		FullName: user.FullName,
		TenantID: tenantID,
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenStr, err := accessToken.SignedString(p.secret)
	if err != nil {
		return nil, fmt.Errorf("signing access token: %w", err)
	}

	refreshClaims := jwt.RegisteredClaims{
		Issuer:    p.issuer,
		Subject:   user.ID.String(),
		ExpiresAt: jwt.NewNumericDate(now.Add(p.refreshTTL)),
		IssuedAt:  jwt.NewNumericDate(now),
		ID:        uuid.New().String(),
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenStr, err := refreshToken.SignedString(p.secret)
	if err != nil {
		return nil, fmt.Errorf("signing refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessTokenStr,
		RefreshToken: refreshTokenStr,
		ExpiresAt:    expiresAt,
	}, nil
}

func (p *JWTProvider) ValidateAccessToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return p.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("parsing token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

func (p *JWTProvider) ValidateRefreshToken(tokenStr string) (uuid.UUID, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &jwt.RegisteredClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return p.secret, nil
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("parsing refresh token: %w", err)
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return uuid.Nil, fmt.Errorf("invalid refresh token")
	}

	userID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, fmt.Errorf("parsing user ID from token: %w", err)
	}

	return userID, nil
}
