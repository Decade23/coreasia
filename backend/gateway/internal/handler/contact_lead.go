package handler

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type contactLeadStore interface {
	Create(ctx context.Context, lead *model.ContactLead) error
}

type contactLeadNotifier interface {
	SendContactLeadNotification(ctx context.Context, lead *model.ContactLead) error
}

// contactLeadCRM meneruskan lead ke pipeline LeadKu. Dipisahkan sebagai
// interface agar handler bisa diuji tanpa jaringan.
type contactLeadCRM interface {
	PushContactLead(ctx context.Context, lead *model.ContactLead) error
}

type ContactLeadHandler struct {
	repo     contactLeadStore
	notifier contactLeadNotifier
	crm      contactLeadCRM
}

func NewContactLeadHandler(repo *repository.ContactLeadRepo, notifier *service.EmailService, crm *service.CRMService) *ContactLeadHandler {
	return &ContactLeadHandler{repo: repo, notifier: notifier, crm: crm}
}

// Create durably captures a public contact-form submission.
// POST /api/public/leads
func (h *ContactLeadHandler) Create(c fiber.Ctx) error {
	var req model.CreateContactLeadRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	normalizeContactLeadRequest(&req)
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	// Browsers normally send document.referrer in the payload. Keep the HTTP
	// Referer as a safe fallback so attribution is not lost when it is omitted.
	if req.Referrer == "" {
		req.Referrer = strings.TrimSpace(c.Get("Referer"))
		if len(req.Referrer) > 2048 {
			req.Referrer = req.Referrer[:2048]
		}
	}

	lead := &model.ContactLead{
		Name:        req.Name,
		Email:       req.Email,
		Phone:       optionalString(req.Phone),
		Subject:     req.Subject,
		Message:     req.Message,
		Consent:     req.Consent,
		Status:      model.ContactLeadStatusNew,
		BudgetRange: optionalString(req.BudgetRange),
		UTMSource:   optionalString(req.UTMSource),
		UTMMedium:   optionalString(req.UTMMedium),
		UTMCampaign: optionalString(req.UTMCampaign),
		UTMContent:  optionalString(req.UTMContent),
		UTMTerm:     optionalString(req.UTMTerm),
		GCLID:       optionalString(req.GCLID),
		FBCLID:      optionalString(req.FBCLID),
		LandingPage: optionalString(req.LandingPage),
		Referrer:    optionalString(req.Referrer),
	}

	if err := h.repo.Create(c.Context(), lead); err != nil {
		slog.Error("gagal menyimpan contact lead", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	h.notifyAsync(*lead)
	h.pushToCRMAsync(*lead)

	return c.Status(fiber.StatusCreated).JSON(model.ContactLeadCreatedResponse{
		Success: true,
		LeadID:  lead.ID,
		Status:  lead.Status,
	})
}

func (h *ContactLeadHandler) notifyAsync(lead model.ContactLead) {
	if h.notifier == nil {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := h.notifier.SendContactLeadNotification(ctx, &lead); err != nil {
			slog.Error("gagal mengirim notifikasi contact lead", "lead_id", lead.ID, "error", err)
		}
	}()
}

// pushToCRMAsync meneruskan lead ke LeadKu di latar belakang.
//
// Dijalankan terpisah dari notifyAsync, bukan digabung, supaya kegagalan salah
// satunya tidak pernah membatalkan yang lain. Email adalah kanal yang dijamin;
// CRM adalah pelengkap yang boleh gagal.
func (h *ContactLeadHandler) pushToCRMAsync(lead model.ContactLead) {
	if h.crm == nil {
		return
	}

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := h.crm.PushContactLead(ctx, &lead); err != nil {
			slog.Error("gagal meneruskan lead ke CRM", "lead_id", lead.ID, "error", err)
		}
	}()
}

func normalizeContactLeadRequest(req *model.CreateContactLeadRequest) {
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Phone = strings.TrimSpace(req.Phone)
	req.Subject = strings.TrimSpace(req.Subject)
	req.BudgetRange = strings.TrimSpace(req.BudgetRange)
	req.Message = strings.TrimSpace(req.Message)
	req.UTMSource = strings.TrimSpace(req.UTMSource)
	req.UTMMedium = strings.TrimSpace(req.UTMMedium)
	req.UTMCampaign = strings.TrimSpace(req.UTMCampaign)
	req.UTMContent = strings.TrimSpace(req.UTMContent)
	req.UTMTerm = strings.TrimSpace(req.UTMTerm)
	req.GCLID = strings.TrimSpace(req.GCLID)
	req.FBCLID = strings.TrimSpace(req.FBCLID)
	req.LandingPage = strings.TrimSpace(req.LandingPage)
	req.Referrer = strings.TrimSpace(req.Referrer)
}

func optionalString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
