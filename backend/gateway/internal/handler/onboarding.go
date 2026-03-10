package handler

import (
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type OnboardingHandler struct {
	tenantRepo  *repository.TenantRepo
	planRepo    *repository.PlanRepo
	provisioner *service.Provisioner
	midtrans    *service.MidtransService
}

func NewOnboardingHandler(
	tenantRepo *repository.TenantRepo,
	planRepo *repository.PlanRepo,
	provisioner *service.Provisioner,
	midtrans *service.MidtransService,
) *OnboardingHandler {
	return &OnboardingHandler{
		tenantRepo:  tenantRepo,
		planRepo:    planRepo,
		provisioner: provisioner,
		midtrans:    midtrans,
	}
}

// CheckSlug checks if a slug is available.
// GET /api/onboarding/check-slug?slug=xxx
func (h *OnboardingHandler) CheckSlug(c fiber.Ctx) error {
	slug := strings.TrimSpace(c.Query("slug"))
	if slug == "" {
		return errResponse(c, apperr.NewBadRequest("Parameter 'slug' wajib diisi"))
	}

	slug = strings.ToLower(slug)

	tenant, err := h.tenantRepo.FindBySlug(c.Context(), slug)
	if err != nil {
		slog.Error("failed to check slug", "slug", slug, "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	available := tenant == nil

	return ok(c, model.SlugCheckResponse{
		Slug:      slug,
		Available: available,
	})
}

// Register handles new tenant registration.
// POST /api/onboarding/register
func (h *OnboardingHandler) Register(c fiber.Ctx) error {
	var req model.RegisterRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}

	// Validate
	if validErr := validate.Struct(&req); validErr != nil {
		return errResponse(c, validErr)
	}

	// Normalize slug
	req.Slug = strings.ToLower(strings.TrimSpace(req.Slug))

	// Check slug uniqueness
	existing, err := h.tenantRepo.FindBySlug(c.Context(), req.Slug)
	if err != nil {
		slog.Error("failed to check slug uniqueness", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if existing != nil {
		return errResponse(c, apperr.NewConflict("Slug sudah digunakan"))
	}

	// Check plan exists
	plan, err := h.planRepo.FindByID(c.Context(), req.PlanID)
	if err != nil {
		slog.Error("failed to find plan", "plan_id", req.PlanID, "error", err)
		return errResponse(c, apperr.NewNotFound("Paket langganan"))
	}
	if !plan.IsActive {
		return errResponse(c, apperr.NewBadRequest("Paket langganan tidak aktif"))
	}

	// Hash password
	hashedPw, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("failed to hash password", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	// Determine if this is a free trial (price_monthly == 0)
	isTrial := plan.PriceMonthly == 0
	if !isTrial && !h.midtrans.IsConfigured() {
		return errResponse(c, apperr.NewServiceUnavailable("Pembayaran online belum dikonfigurasi"))
	}

	// Build schema name from slug (prefix with "t_" to avoid conflicts)
	schemaName := "t_" + req.Slug

	regID := uuid.New()
	var paymentProvider *string
	var paymentReference *string
	var paymentCheckout *string
	var adminPhone *string

	if req.AdminPhone != "" {
		adminPhone = &req.AdminPhone
	}

	if !isTrial {
		midtransResult, err := h.midtrans.CreateSnapTransaction(c.Context(), service.CreatePaymentInput{
			RegistrationID: regID,
			OrgName:        req.OrgName,
			PlanName:       plan.Name,
			AdminName:      req.AdminName,
			AdminEmail:     req.AdminEmail,
			AdminPhone:     adminPhone,
			Amount:         plan.PriceMonthly,
		})
		if err != nil {
			slog.Error("failed to create midtrans transaction", "error", err, "plan_id", req.PlanID)
			return errResponse(c, apperr.NewInternal(err))
		}

		provider := "midtrans"
		paymentProvider = &provider
		paymentReference = &midtransResult.Reference
		paymentCheckout = &midtransResult.CheckoutURL
	}

	// Create tenant (is_active = false initially)
	tenant := &model.Tenant{
		ID:         uuid.New(),
		Name:       req.OrgName,
		Slug:       req.Slug,
		SchemaName: schemaName,
		IsActive:   false,
		PlanID:     &req.PlanID,
	}

	if err := h.tenantRepo.Create(c.Context(), tenant); err != nil {
		slog.Error("failed to create tenant", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	// Create registration record
	var trialEndsAt *time.Time
	if isTrial {
		t := time.Now().AddDate(0, 0, 30) // 30 days trial
		trialEndsAt = &t
	}

	reg := &model.TenantRegistration{
		ID:               regID,
		TenantID:         &tenant.ID,
		OrgName:          req.OrgName,
		OrgType:          req.OrgType,
		AdminEmail:       req.AdminEmail,
		AdminName:        req.AdminName,
		AdminPhone:       adminPhone,
		PasswordHash:     string(hashedPw),
		PlanID:           req.PlanID,
		PaymentProvider:  paymentProvider,
		PaymentReference: paymentReference,
		PaymentCheckout:  paymentCheckout,
		PaymentStatus:    "pending",
		Amount:           plan.PriceMonthly,
		ProvisionStatus:  "pending",
		IsTrial:          isTrial,
		TrialEndsAt:      trialEndsAt,
	}

	if err := h.tenantRepo.CreateRegistration(c.Context(), reg); err != nil {
		slog.Error("failed to create registration", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	// If free trial, provision immediately
	if isTrial {
		if err := h.provisioner.ProvisionTenant(c.Context(), reg, tenant); err != nil {
			slog.Error("failed to provision tenant", "schema", schemaName, "error", err)
			// Registration is created, but provisioning failed.
			// The status will remain "pending" so it can be retried.
			return errResponse(c, apperr.NewInternal(err))
		}

		loginURL := fmt.Sprintf("https://%s.coreasia.id", req.Slug)
		return created(c, model.RegisterResponse{
			RegistrationID: reg.ID,
			Status:         "ready",
			LoginURL:       &loginURL,
		})
	}

	// Paid plan: return pending_payment status (Xendit integration later)
	return created(c, model.RegisterResponse{
		RegistrationID: reg.ID,
		Status:         "pending_payment",
		InvoiceURL:     paymentCheckout,
	})
}

// Status checks the registration/provisioning status.
// GET /api/onboarding/status/:id
func (h *OnboardingHandler) Status(c fiber.Ctx) error {
	idParam := c.Params("id")
	regID, err := uuid.Parse(idParam)
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID registrasi tidak valid"))
	}

	reg, err := h.tenantRepo.FindRegistrationByID(c.Context(), regID)
	if err != nil {
		slog.Error("failed to find registration", "id", regID, "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if reg == nil {
		return errResponse(c, apperr.NewNotFound("Registrasi"))
	}

	// Determine overall status
	status := "pending_payment"
	var loginURL *string
	var invoiceURL *string

	if reg.PaymentStatus != "paid" {
		invoiceURL = reg.PaymentCheckout
	}

	if reg.ProvisionStatus == "completed" {
		status = "ready"
		// Look up tenant slug for login URL
		if reg.TenantID != nil {
			tenant, err := h.tenantRepo.FindByID(c.Context(), *reg.TenantID)
			if err == nil && tenant != nil {
				url := fmt.Sprintf("https://%s.coreasia.id", tenant.Slug)
				loginURL = &url
			}
		}
	} else if reg.PaymentStatus == "paid" && reg.ProvisionStatus == "pending" {
		status = "provisioning"
	} else if reg.PaymentStatus == "failed" {
		status = "payment_failed"
	} else if reg.PaymentStatus == "review" {
		status = "payment_review"
	}

	return ok(c, model.RegistrationStatusResponse{
		RegistrationID:  reg.ID,
		Status:          status,
		PaymentStatus:   reg.PaymentStatus,
		ProvisionStatus: reg.ProvisionStatus,
		LoginURL:        loginURL,
		InvoiceURL:      invoiceURL,
	})
}

// MidtransWebhook handles Midtrans HTTP notifications.
// POST /api/onboarding/webhook
func (h *OnboardingHandler) MidtransWebhook(c fiber.Ctx) error {
	var payload service.MidtransNotification
	if err := c.Bind().JSON(&payload); err != nil {
		return errResponse(c, apperr.NewBadRequest("Payload webhook Midtrans tidak valid"))
	}

	if !h.midtrans.VerifySignature(payload) {
		slog.Warn("midtrans webhook signature mismatch", "order_id", payload.OrderID)
		return errResponse(c, apperr.NewUnauthorized("Signature Midtrans tidak valid"))
	}

	reg, err := h.tenantRepo.FindRegistrationByPaymentReference(c.Context(), payload.OrderID)
	if err != nil {
		slog.Error("failed to find registration by payment reference", "reference", payload.OrderID, "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if reg == nil {
		return errResponse(c, apperr.NewNotFound("Registrasi pembayaran"))
	}

	status, err := h.midtrans.GetTransactionStatus(c.Context(), payload.OrderID)
	if err != nil {
		slog.Error("failed to verify midtrans status", "reference", payload.OrderID, "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	paymentStatus, shouldProvision := h.midtrans.MapPaymentStatus(status)
	var paymentMethod *string
	if strings.TrimSpace(status.PaymentType) != "" {
		method := status.PaymentType
		paymentMethod = &method
	}

	var paidAt *time.Time
	if paymentStatus == "paid" {
		now := time.Now()
		paidAt = &now
	}

	if err := h.tenantRepo.UpdateRegistrationPayment(c.Context(), reg.ID, paymentStatus, paymentMethod, paidAt); err != nil {
		slog.Error("failed to update registration payment", "registration_id", reg.ID, "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	if shouldProvision && reg.ProvisionStatus != "completed" {
		if reg.TenantID == nil {
			return errResponse(c, apperr.NewInternal(fmt.Errorf("registration %s tidak memiliki tenant_id", reg.ID)))
		}

		tenant, err := h.tenantRepo.FindByID(c.Context(), *reg.TenantID)
		if err != nil {
			slog.Error("failed to load tenant for provisioning", "tenant_id", reg.TenantID, "error", err)
			return errResponse(c, apperr.NewInternal(err))
		}
		if tenant == nil {
			return errResponse(c, apperr.NewNotFound("Tenant"))
		}

		reg.PaymentStatus = paymentStatus
		reg.PaymentMethod = paymentMethod
		reg.PaidAt = paidAt

		if err := h.provisioner.ProvisionTenant(c.Context(), reg, tenant); err != nil {
			slog.Error("failed to provision tenant after payment", "registration_id", reg.ID, "error", err)
			return errResponse(c, apperr.NewInternal(err))
		}
	}

	return ok(c, fiber.Map{
		"received": true,
		"status":   paymentStatus,
	})
}

func (h *OnboardingHandler) RegisterRoutes(api fiber.Router) {
	onboarding := api.Group("/onboarding")
	onboarding.Get("/check-slug", h.CheckSlug)
	onboarding.Post("/register", h.Register)
	onboarding.Post("/webhook", h.MidtransWebhook)
	onboarding.Get("/status/:id", h.Status)
}
