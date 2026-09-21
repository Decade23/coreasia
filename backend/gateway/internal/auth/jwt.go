package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// MFAChallengeTTL adalah umur tantangan MFA yang diterbitkan login untuk admin
// ber-TOTP. Cukup untuk membuka aplikasi authenticator, terlalu pendek untuk
// dicuri lalu dipakai belakangan.
const MFAChallengeTTL = 5 * time.Minute

// MFAMaxAge adalah umur maksimal sesi ber-MFA, dihitung dari saat kode TOTP
// diverifikasi (klaim mfa_at). Access maupun refresh token ber-MFA tidak pernah
// berlaku melewati mfa_at + MFAMaxAge, berapa kali pun di-refresh. Sesudahnya
// admin login ulang memakai sandi + TOTP. Tanpa batas ini, refresh token
// ber-MFA yang bocor menjadi sesi mfa=true yang hidup selamanya asal dipakai
// sekali per JWT_REFRESH_TTL.
const MFAMaxAge = 12 * time.Hour

// ErrWrongTokenType dikembalikan validator saat tanda tangan dan masa berlaku
// sah, tetapi jenis tokennya bukan yang diminta (termasuk token tanpa typ).
var ErrWrongTokenType = errors.New("jenis token tidak sesuai")

// ErrMFAExpired: sesi ber-MFA sudah melewati MFAMaxAge; tidak ada token baru
// yang boleh diterbitkan untuknya.
var ErrMFAExpired = errors.New("sesi ber-MFA sudah melewati umur maksimal")

type JWTProvider struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
	issuer     string
	// now dapat diganti di uji untuk menerbitkan token di masa lalu.
	now func() time.Time
}

type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	// RefreshExpiresAt: kedaluwarsa refresh token (umur cookie refresh).
	RefreshExpiresAt time.Time `json:"-"`
}

func NewJWTProvider(secret string, accessTTL, refreshTTL time.Duration, issuer string) *JWTProvider {
	return &JWTProvider{
		secret:     []byte(secret),
		accessTTL:  accessTTL,
		refreshTTL: refreshTTL,
		issuer:     issuer,
		now:        time.Now,
	}
}

func (p *JWTProvider) sign(c Claims) (string, error) {
	return jwt.NewWithClaims(jwt.SigningMethodHS256, c).SignedString(p.secret)
}

func (p *JWTProvider) registered(userID uuid.UUID, now time.Time, ttl time.Duration) jwt.RegisteredClaims {
	return p.registeredUntil(userID, now, now.Add(ttl))
}

func (p *JWTProvider) registeredUntil(userID uuid.UUID, now, exp time.Time) jwt.RegisteredClaims {
	return jwt.RegisteredClaims{
		Subject:   userID.String(),
		Issuer:    p.issuer,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(exp),
		ID:        uuid.New().String(),
	}
}

// GenerateTokenPair menerbitkan access + refresh token. mfa=true menandai bahwa
// pemegangnya BARU SAJA lolos TOTP (mfa_at = sekarang); tokenVersion =
// admin_users.token_version saat ini. Refresh memakai GenerateTokenPairMFA
// supaya mfa_at yang lama terbawa.
func (p *JWTProvider) GenerateTokenPair(userID uuid.UUID, email, role, fullName string, mfa bool, tokenVersion int) (*TokenPair, error) {
	var mfaAt time.Time
	if mfa {
		mfaAt = p.now()
	}
	return p.GenerateTokenPairMFA(userID, email, role, fullName, mfaAt, tokenVersion)
}

// GenerateTokenPairMFA menerbitkan access + refresh token. mfaAt = saat kode
// TOTP diverifikasi (waktu nol = sesi tanpa MFA). Untuk sesi ber-MFA, masa
// berlaku kedua token dipotong di mfaAt + MFAMaxAge; bila batas itu sudah
// lewat, tidak ada token yang terbit (ErrMFAExpired).
func (p *JWTProvider) GenerateTokenPairMFA(userID uuid.UUID, email, role, fullName string, mfaAt time.Time, tokenVersion int) (*TokenPair, error) {
	now := p.now()
	accessExpiry := now.Add(p.accessTTL)
	refreshExpiry := now.Add(p.refreshTTL)

	mfa := !mfaAt.IsZero()
	var mfaUnix int64
	if mfa {
		mfaUnix = mfaAt.Unix()
		limit := time.Unix(mfaUnix, 0).Add(MFAMaxAge)
		if !limit.After(now) {
			return nil, ErrMFAExpired
		}
		if accessExpiry.After(limit) {
			accessExpiry = limit
		}
		if refreshExpiry.After(limit) {
			refreshExpiry = limit
		}
	}

	accessStr, err := p.sign(Claims{
		RegisteredClaims: p.registeredUntil(userID, now, accessExpiry),
		UserID:           userID,
		Email:            email,
		Role:             role,
		FullName:         fullName,
		Typ:              TokenTypeAccess,
		MFA:              mfa,
		MFAAt:            mfaUnix,
		TV:               tokenVersion,
	})
	if err != nil {
		return nil, fmt.Errorf("signing access token: %w", err)
	}

	refreshStr, err := p.sign(Claims{
		RegisteredClaims: p.registeredUntil(userID, now, refreshExpiry),
		UserID:           userID,
		Email:            email,
		Role:             role,
		Typ:              TokenTypeRefresh,
		MFA:              mfa,
		MFAAt:            mfaUnix,
		TV:               tokenVersion,
	})
	if err != nil {
		return nil, fmt.Errorf("signing refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:      accessStr,
		RefreshToken:     refreshStr,
		ExpiresAt:        accessExpiry,
		RefreshExpiresAt: refreshExpiry,
	}, nil
}

// GenerateMFAChallenge menerbitkan tantangan berumur MFAChallengeTTL yang
// hanya bisa ditukar di /admin/auth/totp/verify (bersama kode TOTP).
func (p *JWTProvider) GenerateMFAChallenge(userID uuid.UUID, email string, tokenVersion int) (string, time.Time, error) {
	now := p.now()
	str, err := p.sign(Claims{
		RegisteredClaims: p.registered(userID, now, MFAChallengeTTL),
		UserID:           userID,
		Email:            email,
		Typ:              TokenTypeMFA,
		TV:               tokenVersion,
	})
	if err != nil {
		return "", time.Time{}, fmt.Errorf("signing mfa challenge: %w", err)
	}
	return str, now.Add(MFAChallengeTTL), nil
}

// ValidateAccess menerima hanya access token (typ=access).
func (p *JWTProvider) ValidateAccess(tokenStr string) (*Claims, error) {
	return p.validate(tokenStr, TokenTypeAccess)
}

// ValidateRefresh menerima hanya refresh token (typ=refresh).
func (p *JWTProvider) ValidateRefresh(tokenStr string) (*Claims, error) {
	return p.validate(tokenStr, TokenTypeRefresh)
}

// ValidateMFAChallenge menerima hanya tantangan MFA (typ=mfa).
func (p *JWTProvider) ValidateMFAChallenge(tokenStr string) (*Claims, error) {
	return p.validate(tokenStr, TokenTypeMFA)
}

func (p *JWTProvider) validate(tokenStr, want string) (*Claims, error) {
	opts := []jwt.ParserOption{
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	}
	if p.issuer != "" {
		opts = append(opts, jwt.WithIssuer(p.issuer))
	}

	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return p.secret, nil
	}, opts...)
	if err != nil {
		return nil, fmt.Errorf("parsing token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}
	if claims.Typ != want {
		return nil, ErrWrongTokenType
	}
	if claims.UserID == uuid.Nil {
		return nil, fmt.Errorf("invalid token claims: user_id kosong")
	}

	return claims, nil
}
