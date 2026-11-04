package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// Nama tidak menentukan kepercayaan. Semua browser memakai id acak dari server.
func deviceName(ua string) string {
	browser := "Browser"
	switch {
	case strings.Contains(ua, "Edg/"):
		browser = "Edge"
	case strings.Contains(ua, "Chrome/"):
		browser = "Chrome"
	case strings.Contains(ua, "Firefox/"):
		browser = "Firefox"
	case strings.Contains(ua, "Safari/"):
		browser = "Safari"
	}
	os := "perangkat ini"
	switch {
	case strings.Contains(ua, "Android"):
		os = "Android"
	case strings.Contains(ua, "iPhone"):
		os = "iPhone"
	case strings.Contains(ua, "iPad"):
		os = "iPad"
	case strings.Contains(ua, "Windows"):
		os = "Windows"
	case strings.Contains(ua, "Macintosh"):
		os = "Mac"
	case strings.Contains(ua, "Linux"):
		os = "Linux"
	}
	return browser + " di " + os
}

func (h *AuthHandler) issueDevicePair(c fiber.Ctx, user *model.AdminUser, id uuid.UUID, mfaAt time.Time) error {
	tokens, err := h.jwt.GenerateTrustedPair(user.ID, user.Email, user.Role, user.FullName, mfaAt, user.TokenVersion, id)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	setAuthCookies(c, tokens)
	c.Set(fiber.HeaderCacheControl, "no-store")
	return ok(c, model.LoginResponse{AccessToken: tokens.AccessToken, RefreshToken: tokens.RefreshToken, ExpiresAt: tokens.ExpiresAt, User: user.ToResponse()})
}

func (h *AuthHandler) completeTrustedLogin(c fiber.Ctx, user *model.AdminUser) error {
	if h.devices == nil {
		return errResponse(c, apperr.NewServiceUnavailable("Perangkat tepercaya belum tersedia."))
	}
	now := h.wallNow()
	d := auth.TrustedDevice{ID: uuid.New(), AdminID: user.ID, TokenVersion: user.TokenVersion, Name: deviceName(c.Get("User-Agent")), CreatedAt: now, LastUsedAt: now, ExpiresAt: now.Add(auth.TrustedDeviceTTL)}
	saved, err := h.devices.Create(c.Context(), &d)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if !saved {
		return errResponse(c, errSessionRevoked())
	}
	_ = h.userRepo.UpdateLastLogin(c.Context(), user.ID)
	h.audit(c, user, "trusted_device_enroll", "Admin mempercayai perangkat selama 7 hari; diperpanjang saat digunakan")
	h.audit(c, user, "login", "Admin login (TOTP, perangkat tepercaya)")
	return h.issueDevicePair(c, user, d.ID, now)
}

func (h *AuthHandler) EnrollTrustedDevice(c fiber.Ctx) error {
	claims, user, appErr := h.sessionUser(c)
	if appErr != nil {
		return errResponse(c, appErr)
	}
	if !user.TOTPEnabled() || !claims.HasFreshMFA(h.wallNow()) || h.wallNow().Sub(claims.MFATime()) > 10*time.Minute {
		return errResponse(c, &apperr.AppError{Code: "MFA_STEP_UP_REQUIRED", Message: "Verifikasi kode TOTP terlebih dahulu untuk mempercayai perangkat ini.", HTTPStatus: 403})
	}
	if claims.DeviceID != "" {
		return errResponse(c, apperr.NewConflict("Perangkat ini sudah dipercaya."))
	}
	// mfa_at tidak diperbarui di sini: hanya TOTP sungguhan boleh menyegarkannya.
	if h.devices == nil {
		return errResponse(c, apperr.NewServiceUnavailable("Perangkat tepercaya belum tersedia."))
	}
	now := h.wallNow()
	d := auth.TrustedDevice{ID: uuid.New(), AdminID: user.ID, TokenVersion: user.TokenVersion, Name: deviceName(c.Get("User-Agent")), CreatedAt: now, LastUsedAt: now, ExpiresAt: now.Add(auth.TrustedDeviceTTL)}
	saved, err := h.devices.Create(c.Context(), &d)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if !saved {
		return errResponse(c, errSessionRevoked())
	}
	h.audit(c, user, "trusted_device_enroll", "Admin mempercayai perangkat selama 7 hari; diperpanjang saat digunakan")
	return h.issueDevicePair(c, user, d.ID, claims.MFATime())
}

func (h *AuthHandler) TrustedDevices(c fiber.Ctx) error {
	claims, user, appErr := h.sessionUser(c)
	if appErr != nil {
		return errResponse(c, appErr)
	}
	if h.devices == nil {
		return errResponse(c, apperr.NewServiceUnavailable("Daftar perangkat belum tersedia."))
	}
	devices, err := h.devices.List(c.Context(), user.ID, user.TokenVersion, h.wallNow())
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	for i := range devices {
		devices[i].Current = devices[i].ID.String() == claims.DeviceID
	}
	c.Set(fiber.HeaderCacheControl, "no-store")
	return ok(c, devices)
}

func (h *AuthHandler) RevokeTrustedDevice(c fiber.Ctx) error {
	_, user, appErr := h.sessionUser(c)
	if appErr != nil {
		return errResponse(c, appErr)
	}
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("Perangkat tidak dikenal."))
	}
	if h.devices == nil {
		return errResponse(c, apperr.NewServiceUnavailable("Perangkat belum dapat dicabut."))
	}
	changed, err := h.devices.Revoke(c.Context(), id, user.ID, h.wallNow())
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if !changed {
		return errResponse(c, apperr.NewNotFound("Perangkat"))
	}
	h.audit(c, user, "trusted_device_revoke", "Admin mencabut perangkat tepercaya miliknya")
	return c.SendStatus(http.StatusNoContent)
}

// Kode memakai pembatas dan anti-replay yang sama dengan login. Tidak menerima
// tantangan login, password saja, atau bukti dari perangkat milik admin lain.
func (h *AuthHandler) TOTPStepUp(c fiber.Ctx) error {
	if h.totp == nil {
		return errResponse(c, errTOTPUnavailable())
	}
	claims, user, appErr := h.sessionUser(c)
	if appErr != nil {
		return errResponse(c, appErr)
	}
	if !user.TOTPEnabled() {
		return errResponse(c, apperr.NewConflict("TOTP belum aktif."))
	}
	var req model.TOTPCodeRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	code, valid := auth.NormalizeTOTPCode(req.Code)
	if !valid {
		return errResponse(c, apperr.NewBadRequest("Kode TOTP harus 6 digit angka"))
	}
	res, appErr := h.reserveAttempt(c, user.ID)
	if appErr != nil {
		return errResponse(c, appErr)
	}
	secret, err := h.totp.Open(user.ID, *user.TOTPSecretEnc)
	if err != nil {
		h.refund(c, user, "step_up", causeSecretUnreadable, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	step, matched, err := auth.VerifyTOTP(secret, code, h.now(), user.TOTPLastStep)
	if err != nil {
		h.refund(c, user, "step_up", causeSecretCorrupt, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !matched {
		h.logRejected(c, user, "step_up", res)
		return errResponse(c, errTOTPInvalid(400))
	}
	consumed, err := h.userRepo.ConsumeTOTPStep(c.Context(), user.ID, step)
	if err != nil {
		h.refund(c, user, "step_up", causeDBWrite, err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if !consumed {
		h.logRejected(c, user, "step_up", res)
		return errResponse(c, errTOTPInvalid(400))
	}
	h.resetFailures(c, user.ID)
	h.audit(c, user, "totp_step_up", "Admin memverifikasi TOTP tanpa keluar dari Console")
	if claims.DeviceID != "" {
		id, err := uuid.Parse(claims.DeviceID)
		if err != nil || h.devices == nil {
			return errResponse(c, errSessionRevoked())
		}
		now := h.wallNow()
		renewed, err := h.devices.Renew(c.Context(), id, user.ID, user.TokenVersion, now, now.Add(auth.TrustedDeviceTTL))
		if err != nil {
			return errResponse(c, apperr.NewServiceUnavailable("Perangkat belum dapat diperiksa. Coba lagi sebentar lagi."))
		}
		if !renewed {
			return errResponse(c, errSessionRevoked())
		}
		return h.issueDevicePair(c, user, id, h.wallNow())
	}
	return h.completeLogin(c, user, true, "Admin memverifikasi TOTP dalam sesi Console")
}
