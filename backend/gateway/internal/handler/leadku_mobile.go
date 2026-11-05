package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

const leadkuPlayURL = "https://play.google.com/store/apps/details?id=id.coreasia.leadku"

var leadkuVersionPattern = regexp.MustCompile(`^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][a-zA-Z0-9.-]+)?$`)
var leadkuScreens = map[string]bool{"": true, "home": true, "contacts": true, "pipeline": true, "tasks": true, "profile": true, "contact": true, "deal": true, "task": true, "company": true, "agenda": true, "reports": true, "commerce": true, "document": true, "activities": true, "activity": true, "tim": true, "anggota": true, "kolamLead": true, "notifications": true, "sinkron": true, "login": true, "other": true}
var leadkuEvents = map[string]bool{"session_start": true, "screen_view": true, "update_shown": true, "update_clicked": true, "update_dismissed": true, "api_error": true}

type leadkuMobileStore interface {
	Pulse(context.Context, string, model.LeadkuMobilePulse) error
	Policy(context.Context, string) (model.LeadkuMobilePolicy, error)
	UpdatePolicy(context.Context, model.LeadkuMobilePolicy, string) (model.LeadkuMobilePolicy, error)
	Summary(context.Context, string) (*model.LeadkuMobileSummary, error)
	ImportPlay(context.Context, []model.LeadkuPlayDay) error
}
type LeadkuMobileHandler struct {
	playSync *service.LeadkuPlaySync
	repo     leadkuMobileStore
	audit    auditLogger
}

func NewLeadkuMobileHandler(repo *repository.LeadkuMobileRepo, audit auditLogger) *LeadkuMobileHandler {
	return &LeadkuMobileHandler{repo: repo, audit: audit, playSync: service.NewLeadkuPlaySync(repo)}
}
func leadkuChannel(pkg string) string {
	switch pkg {
	case "id.coreasia.leadku":
		return "production"
	case "id.coreasia.leadku.qa.prod":
		return "uat"
	}
	return ""
}
func validLeadkuPulse(p model.LeadkuMobilePulse) bool {
	if _, err := uuid.Parse(p.InstallationID); err != nil {
		return false
	}
	if !p.UsageConsent || leadkuChannel(p.Package) == "" || !leadkuVersionPattern.MatchString(p.AppVersion) || len(p.AppVersion) > 40 || p.VersionCode <= 0 || p.VersionCode > 2100000000 || !regexp.MustCompile(`^[0-9]{1,2}(?:\.[0-9]{1,3}){0,2}$`).MatchString(p.OSVersion) || len(p.Events) == 0 || len(p.Events) > 20 {
		return false
	}
	for _, e := range p.Events {
		if _, err := uuid.Parse(e.ID); err != nil {
			return false
		}
		if !leadkuEvents[e.Kind] || !leadkuScreens[e.Screen] || e.TargetCode != nil && (*e.TargetCode <= 0 || *e.TargetCode > 2100000000) {
			return false
		}
	}
	return true
}
func (h *LeadkuMobileHandler) Pulse(c fiber.Ctx) error {
	if len(c.Body()) > 16384 {
		return errResponse(c, apperr.NewBadRequest("Data perangkat terlalu besar"))
	}
	var p model.LeadkuMobilePulse
	if json.Unmarshal(c.Body(), &p) != nil || !validLeadkuPulse(p) {
		return errResponse(c, apperr.NewBadRequest("Data perangkat tidak valid"))
	}
	if err := h.repo.Pulse(c.Context(), leadkuChannel(p.Package), p); err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	return ok(c, fiber.Map{"recorded": true})
}
func (h *LeadkuMobileHandler) Policy(c fiber.Ctx) error {
	channel := leadkuChannel(c.Query("package"))
	if channel == "" {
		return errResponse(c, apperr.NewBadRequest("Aplikasi tidak dikenal"))
	}
	p, err := h.repo.Policy(c.Context(), channel)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	// A draft release must never block installed clients or advertise an AAB
	// that is still under review. The app also verifies availability itself.
	if !p.Available {
		p.LatestCode = 0
		p.MinimumCode = 0
		p.LatestVersion = ""
		p.Notes = ""
	}
	c.Set("Cache-Control", "no-store")
	return ok(c, fiber.Map{"policy": p, "store_url": leadkuPlayURL})
}
func (h *LeadkuMobileHandler) Summary(c fiber.Ctx) error {
	channel := c.Query("channel", "production")
	if channel != "production" && channel != "uat" {
		return errResponse(c, apperr.NewBadRequest("Pilih kanal aplikasi"))
	}
	s, err := h.repo.Summary(c.Context(), channel)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if h.playSync != nil {
		s.PlaySync = h.playSync.Status(c.Context())
	}
	return ok(c, s)
}
func validLeadkuPolicy(p model.LeadkuMobilePolicy) bool {
	return (p.Channel == "production" || p.Channel == "uat") && p.LatestCode >= 0 && p.LatestCode <= 2100000000 && p.MinimumCode >= 0 && p.MinimumCode <= p.LatestCode && utf8.RuneCountInString(p.Notes) <= 600 && (p.LatestCode == 0 || leadkuVersionPattern.MatchString(p.LatestVersion) && len(p.LatestVersion) <= 40) && (!p.Available || p.LatestCode > 0) && (p.Available || p.MinimumCode == 0)
}
func (h *LeadkuMobileHandler) UpdatePolicy(c fiber.Ctx) error {
	var body struct {
		model.LeadkuMobilePolicy
		ExpectedUpdatedAt string `json:"expected_updated_at"`
	}
	if len(c.Body()) > 4096 || json.Unmarshal(c.Body(), &body) != nil || !validLeadkuPolicy(body.LeadkuMobilePolicy) {
		return errResponse(c, apperr.NewBadRequest("Periksa versi terbaru, versi minimum dan ketersediaan rilis"))
	}
	if _, err := time.Parse(time.RFC3339Nano, body.ExpectedUpdatedAt); err != nil {
		return errResponse(c, apperr.NewBadRequest("Muat ulang pengaturan versi"))
	}
	p, err := h.repo.UpdatePolicy(c.Context(), body.LeadkuMobilePolicy, body.ExpectedUpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return errResponse(c, apperr.NewConflict("Pengaturan berubah. Muat ulang sebelum menyimpan."))
	}
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if h.audit != nil {
		claims := middleware.GetClaims(c)
		h.audit.LogAction(c.Context(), &claims.UserID, &claims.FullName, "leadku_mobile_policy", "leadku", nil, stringPointer(fmt.Sprintf("%s terbaru=%d minimum=%d tersedia=%t", p.Channel, p.LatestCode, p.MinimumCode, p.Available)), c.IP())
	}
	return ok(c, p)
}
func stringPointer(s string) *string { return &s }
func (h *LeadkuMobileHandler) ImportPlay(c fiber.Ctx) error {
	file, err := c.FormFile("report")
	if err != nil || file.Size > 5*1024*1024 {
		return errResponse(c, apperr.NewBadRequest("Pilih laporan instalasi Google Play, maksimal 5 MB"))
	}
	f, err := file.Open()
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("Laporan tidak dapat dibaca"))
	}
	defer f.Close()
	raw, err := io.ReadAll(io.LimitReader(f, 5*1024*1024+1))
	if err != nil || len(raw) > 5*1024*1024 {
		return errResponse(c, apperr.NewBadRequest("Laporan terlalu besar"))
	}
	days, err := service.ParseLeadkuPlayReport(strings.TrimSpace(file.Filename), raw)
	if err != nil {
		return errResponse(c, apperr.NewBadRequest(err.Error()))
	}
	if err = h.repo.ImportPlay(c.Context(), days); err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	return ok(c, fiber.Map{"days": len(days)})
}

func (h *LeadkuMobileHandler) StartPlaySync() func() { return h.playSync.Start(context.Background()) }
func (h *LeadkuMobileHandler) SyncPlay(c fiber.Ctx) error {
	n, err := h.playSync.Sync(c.Context())
	if err != nil {
		return errResponse(c, apperr.NewServiceUnavailable(err.Error()))
	}
	return ok(c, fiber.Map{"days": n})
}
