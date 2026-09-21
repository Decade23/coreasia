package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Jenis token admin. Setiap validator hanya menerima jenisnya sendiri, sehingga
// refresh token tidak bisa dipakai sebagai Bearer, access token tidak bisa
// dipakai untuk refresh, dan tantangan MFA tidak bisa dipakai untuk keduanya.
// Token tanpa typ (diterbitkan sebelum Fase 0c) ditolak di semua validator.
const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
	TokenTypeMFA     = "mfa"
)

type Claims struct {
	jwt.RegisteredClaims
	UserID   uuid.UUID `json:"user_id"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	FullName string    `json:"full_name"`
	// Typ = TokenTypeAccess | TokenTypeRefresh | TokenTypeMFA.
	Typ string `json:"typ,omitempty"`
	// MFA true hanya untuk token yang diterbitkan setelah kode TOTP diverifikasi.
	MFA bool `json:"mfa"`
	// MFAAt = saat (unix detik) kode TOTP diverifikasi; 0 untuk token tanpa MFA.
	// Refresh menyalinnya apa adanya, dan masa berlaku token ber-MFA tidak
	// pernah melewati MFAAt + MFAMaxAge (lihat GenerateTokenPairMFA).
	MFAAt int64 `json:"mfa_at,omitempty"`
	// TV = admin_users.token_version saat token diterbitkan. /me dan /refresh
	// menolak token yang TV-nya berbeda dari nilai di DB.
	TV int `json:"tv"`
}

// MFATime memulangkan saat kode TOTP diverifikasi, atau waktu nol bila token
// ini tidak ber-MFA atau tidak membawa mfa_at (terbit sebelum klaim itu ada).
func (c *Claims) MFATime() time.Time {
	if c == nil || !c.MFA || c.MFAAt <= 0 {
		return time.Time{}
	}
	return time.Unix(c.MFAAt, 0)
}

// HasFreshMFA: token ini lolos TOTP dan verifikasinya belum lebih tua dari
// MFAMaxAge. Token ber-mfa tanpa mfa_at dianggap tidak segar (gagal tertutup).
// Semua gerbang yang menuntut sesi ber-MFA memakai ini, bukan klaim MFA mentah.
func (c *Claims) HasFreshMFA(now time.Time) bool {
	t := c.MFATime()
	return !t.IsZero() && now.Sub(t) < MFAMaxAge
}
