package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type JWTProvider struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
	issuer     string
}

type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

func NewJWTProvider(secret string, accessTTL, refreshTTL time.Duration, issuer string) *JWTProvider {
	return &JWTProvider{
		secret:     []byte(secret),
		accessTTL:  accessTTL,
		refreshTTL: refreshTTL,
		issuer:     issuer,
	}
}

func (p *JWTProvider) GenerateTokenPair(userID uuid.UUID, email, role, fullName string) (*TokenPair, error) {
	now := time.Now()
	accessExpiry := now.Add(p.accessTTL)

	accessClaims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    p.issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(accessExpiry),
			ID:        uuid.New().String(),
		},
		UserID:   userID,
		Email:    email,
		Role:     role,
		FullName: fullName,
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessStr, err := accessToken.SignedString(p.secret)
	if err != nil {
		return nil, fmt.Errorf("signing access token: %w", err)
	}

	refreshClaims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    p.issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(p.refreshTTL)),
			ID:        uuid.New().String(),
		},
		UserID: userID,
		Email:  email,
		Role:   role,
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshStr, err := refreshToken.SignedString(p.secret)
	if err != nil {
		return nil, fmt.Errorf("signing refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessStr,
		RefreshToken: refreshStr,
		ExpiresAt:    accessExpiry,
	}, nil
}

func (p *JWTProvider) ValidateToken(tokenStr string) (*Claims, error) {
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
