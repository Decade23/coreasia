package model

import (
	"time"

	"github.com/google/uuid"
)

type AdminUser struct {
	ID           uuid.UUID  `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	FullName     string     `json:"full_name"`
	Role         string     `json:"role"`
	IsActive     bool       `json:"is_active"`
	LastLoginAt  *time.Time `json:"last_login_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Fase 0c (migrasi 000014). Tidak pernah diserialisasi langsung.
	TokenVersion   int        `json:"-"`
	TOTPSecretEnc  *string    `json:"-"` // rahasia aktif, terenkripsi (auth.TOTPCipher)
	TOTPPendingEnc *string    `json:"-"` // rahasia dari /totp/setup yang belum dikonfirmasi
	TOTPEnabledAt  *time.Time `json:"-"`
	TOTPLastStep   *int64     `json:"-"` // langkah RFC 6238 terakhir yang diterima (anti-replay)
}

// TOTPEnabled: admin ini wajib memasukkan kode TOTP saat login.
func (u *AdminUser) TOTPEnabled() bool {
	return u.TOTPEnabledAt != nil && u.TOTPSecretEnc != nil
}

type AdminUserResponse struct {
	ID          uuid.UUID  `json:"id"`
	Email       string     `json:"email"`
	FullName    string     `json:"full_name"`
	Role        string     `json:"role"`
	IsActive    bool       `json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// LoginResponse adalah bentuk jawaban login (tanpa TOTP), /totp/verify, dan
// /refresh. JANGAN menambah field: landing yang sedang tayang membaca bentuk
// ini apa adanya, dan uji TestLogin_TanpaTOTP_BentukJawabanLama menjaganya.
type LoginResponse struct {
	AccessToken  string            `json:"access_token"`
	RefreshToken string            `json:"refresh_token"`
	ExpiresAt    time.Time         `json:"expires_at"`
	User         AdminUserResponse `json:"user"`
}

// LoginMFAResponse: kata sandi benar, tetapi admin ber-TOTP. Belum ada token;
// Challenge (JWT typ=mfa, 5 menit) ditukar di /admin/auth/totp/verify.
type LoginMFAResponse struct {
	MFARequired bool   `json:"mfa_required"`
	Challenge   string `json:"challenge"`
}

type TOTPVerifyRequest struct {
	Challenge string `json:"challenge" validate:"required"`
	Code      string `json:"code" validate:"required"`
}

type TOTPCodeRequest struct {
	Code string `json:"code" validate:"required"`
}

// TOTPSetupRequest: sandi saat ini, supaya token/cookie curian saja tidak bisa
// mendaftarkan authenticator milik orang lain.
type TOTPSetupRequest struct {
	Password string `json:"password" validate:"required"`
}

type TOTPSetupResponse struct {
	OtpauthURL string `json:"otpauth_url"`
	Secret     string `json:"secret"`
	Issuer     string `json:"issuer"`
	Account    string `json:"account"`
}

// MeResponse = AdminUserResponse + status MFA. MFA berasal dari klaim token
// (sesi ini lolos TOTP dan belum lebih tua dari auth.MFAMaxAge), TOTPEnabled
// dari DB (akun ini mewajibkan TOTP). TOTPEnabledAt (null bila TOTP mati):
// Nitro hanya membaca keberadaannya untuk izin CashFlow T1+ (TOTP masih aktif),
// tanpa masa tenggang (keputusan Master 21 Sep 2026). MFAAt (null bila mfa=false) = saat kode
// TOTP sesi ini diverifikasi, untuk menuntut kesegaran MFA di izin T1+.
type MeResponse struct {
	AdminUserResponse
	MFA           bool       `json:"mfa"`
	MFAAt         *time.Time `json:"mfa_at"`
	TOTPEnabled   bool       `json:"totp_enabled"`
	TOTPEnabledAt *time.Time `json:"totp_enabled_at"`
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
	// CurrentPassword wajib saat mengganti sandi AKUN SENDIRI begitu ada satu
	// saja admin ber-TOTP, supaya access token atau cookie curian saja tidak
	// bisa mengganti sandi pemiliknya (lalu mendaftarkan TOTP atas nama
	// pemilik). Bila dikirim, selalu diperiksa. Diabaikan untuk akun lain.
	CurrentPassword *string `json:"current_password"`
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
