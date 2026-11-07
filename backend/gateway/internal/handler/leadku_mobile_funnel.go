package handler

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"net/mail"
	"regexp"
	"strings"

	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var leadkuSetupAreas = map[string]bool{"contacts": true, "pipeline": true, "tasks": true}
var leadkuWhatsapp = regexp.MustCompile(`^\+[1-9][0-9]{9,14}$`)

func (h *LeadkuMobileHandler) SignupHandoff(c fiber.Ctx) error {
	c.Set("Cache-Control", "no-store")
	var req struct {
		model.LeadkuMobilePulse
		FromDemo bool `json:"from_demo"`
	}
	if len(c.Body()) > 2048 || json.Unmarshal(c.Body(), &req) != nil || !validLeadkuInstallation(req.LeadkuMobilePulse) || len(req.Events) > 0 {
		return errResponse(c, apperr.NewBadRequest("Data pendaftaran tidak valid"))
	}
	ref, err := h.repo.SignupHandoff(c.Context(), leadkuChannel(req.Package), req.LeadkuMobilePulse, req.FromDemo)
	if errors.Is(err, pgx.ErrNoRows) {
		return errResponse(c, apperr.NewBadRequest("Kanal instalasi tidak sesuai"))
	}
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	return ok(c, fiber.Map{"ref": ref})
}

func (h *LeadkuMobileHandler) CompleteSignup(c fiber.Ctx) error {
	c.Set("Cache-Control", "no-store")
	if len(h.funnelBridgeSecret) < 32 {
		return errResponse(c, apperr.NewServiceUnavailable("Pencatatan pendaftaran belum tersedia"))
	}
	provided, okHeader := strings.CutPrefix(c.Get("Authorization"), "Bearer ")
	want, got := sha256.Sum256([]byte(h.funnelBridgeSecret)), sha256.Sum256([]byte(provided))
	if !okHeader || subtle.ConstantTimeCompare(got[:], want[:]) != 1 {
		return errResponse(c, apperr.NewUnauthorized("Autentikasi diperlukan"))
	}
	var req struct {
		Ref string `json:"ref"`
	}
	if len(c.Body()) > 512 || json.Unmarshal(c.Body(), &req) != nil {
		return errResponse(c, apperr.NewBadRequest("Referensi pendaftaran tidak valid"))
	}
	ref, err := uuid.Parse(req.Ref)
	if err != nil || ref == uuid.Nil || ref.String() != req.Ref {
		return errResponse(c, apperr.NewBadRequest("Referensi pendaftaran tidak valid"))
	}
	recorded, err := h.repo.CompleteSignup(c.Context(), ref.String())
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if !recorded {
		return errResponse(c, apperr.NewNotFound("Referensi pendaftaran aktif"))
	}
	return ok(c, fiber.Map{"recorded": true})
}

func normalizeLeadkuSetupContact(channel, contact string) (string, bool) {
	contact = strings.TrimSpace(contact)
	switch channel {
	case "email":
		if len(contact) > 254 || strings.ContainsAny(contact, "\r\n") {
			return "", false
		}
		_, domain, hasDomain := strings.Cut(contact, "@")
		address, err := mail.ParseAddress(contact)
		if hasDomain && strings.Contains(domain, ".") && err == nil && address.Name == "" && address.Address == contact {
			return strings.ToLower(contact), true
		}
	case "whatsapp":
		if leadkuWhatsapp.MatchString(contact) {
			return contact, true
		}
	}
	return "", false
}

func (h *LeadkuMobileHandler) RequestSetupHelp(c fiber.Ctx) error {
	c.Set("Cache-Control", "no-store")
	var req struct {
		model.LeadkuMobilePulse
		ContactChannel string `json:"contact_channel"`
		Contact        string `json:"contact"`
		Topic          string `json:"topic"`
		Consent        bool   `json:"consent"`
	}
	if len(c.Body()) > 2048 || json.Unmarshal(c.Body(), &req) != nil || !validLeadkuInstallation(req.LeadkuMobilePulse) || len(req.Events) > 0 || !req.Consent || (req.Topic != "setup" && !leadkuSetupAreas[req.Topic]) {
		return errResponse(c, apperr.NewBadRequest("Periksa topik dan persetujuan untuk dihubungi"))
	}
	contact, valid := normalizeLeadkuSetupContact(req.ContactChannel, req.Contact)
	if !valid {
		return errResponse(c, apperr.NewBadRequest("Kontak tidak valid"))
	}
	request := model.LeadkuSetupRequest{Channel: req.ContactChannel, Contact: contact, Topic: req.Topic}
	if err := h.repo.CreateSetupRequest(c.Context(), leadkuChannel(req.Package), req.LeadkuMobilePulse, request); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errResponse(c, apperr.NewBadRequest("Kanal instalasi tidak sesuai"))
		}
		// Neither the submitted contact nor SQL error detail belongs in logs.
		return errResponse(c, apperr.NewInternal(nil))
	}
	return ok(c, fiber.Map{"recorded": true})
}

func (h *LeadkuMobileHandler) SetupRequests(c fiber.Ctx) error {
	c.Set("Cache-Control", "no-store")
	channel := c.Query("channel", "production")
	if channel != "production" && channel != "uat" {
		return errResponse(c, apperr.NewBadRequest("Pilih kanal aplikasi"))
	}
	requests, err := h.repo.SetupRequests(c.Context(), channel)
	if err != nil {
		return errResponse(c, apperr.NewInternal(nil))
	}
	if requests == nil {
		requests = []model.LeadkuSetupRequest{}
	}
	return ok(c, requests)
}
