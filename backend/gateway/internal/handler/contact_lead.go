package handler

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log/slog"
	"regexp"
	"strings"

	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
)

type contactLeadStore interface {
	Create(ctx context.Context, lead *model.ContactLead) error
}

type ContactLeadHandler struct{ repo contactLeadStore }

func NewContactLeadHandler(repo *repository.ContactLeadRepo) *ContactLeadHandler {
	return &ContactLeadHandler{repo: repo}
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

	if req.Phone != "" && !regexp.MustCompile(`^\+[1-9][0-9]{7,14}$`).MatchString(req.Phone) {
		return errResponse(c, apperr.NewBadRequest("Nomor WhatsApp tidak valid"))
	}
	if (req.PreferredContact == "whatsapp" && req.Phone == "") || (req.PreferredContact == "email" && req.Email == "") {
		return errResponse(c, apperr.NewBadRequest("Isi kontak sesuai cara dihubungi yang dipilih"))
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
		Name:      req.Name,
		RequestID: req.RequestID, PreferredContact: req.PreferredContact, Timeline: req.Timeline, Organization: req.Organization, SelectedPlan: req.SelectedPlan,
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

	fingerprint, _ := json.Marshal([]any{lead.Name, lead.Email, lead.Phone, lead.Subject, lead.Message, lead.Consent, lead.BudgetRange, lead.PreferredContact, lead.Timeline, lead.Organization, lead.SelectedPlan})
	sum := sha256.Sum256(fingerprint)
	lead.PayloadHash = hex.EncodeToString(sum[:])
	if err := h.repo.Create(c.Context(), lead); err != nil {
		if errors.Is(err, repository.ErrLeadRequestConflict) {
			return errResponse(c, apperr.NewConflict("Brief berubah. Mulai pengiriman baru."))
		}
		slog.Error("gagal menyimpan contact lead", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	status := fiber.StatusCreated
	if lead.Replayed {
		status = fiber.StatusOK
	}
	return c.Status(status).JSON(model.ContactLeadCreatedResponse{
		Reference: lead.Reference, Replayed: lead.Replayed,
		Success: true,
		LeadID:  lead.ID,
		Status:  lead.Status,
	})
}

func normalizeContactLeadRequest(req *model.CreateContactLeadRequest) {
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Phone = strings.NewReplacer(" ", "", "-", "", "(", "", ")", "").Replace(strings.TrimSpace(req.Phone))
	if strings.HasPrefix(req.Phone, "08") {
		req.Phone = "+62" + req.Phone[1:]
	} else if strings.HasPrefix(req.Phone, "628") {
		req.Phone = "+" + req.Phone
	}
	req.PreferredContact = strings.TrimSpace(req.PreferredContact)
	req.Timeline = strings.TrimSpace(req.Timeline)
	req.Organization = strings.TrimSpace(req.Organization)
	req.SelectedPlan = strings.TrimSpace(req.SelectedPlan)
	req.RequestID = strings.TrimSpace(req.RequestID)
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
