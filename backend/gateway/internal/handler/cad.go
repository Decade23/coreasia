package handler

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/internal/service"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// cadDownloadURL is the public DMG link emailed to buyers on purchase.
const cadDownloadURL = "https://assets.coreasia.id/CoreAsia-Download-Manager.dmg"

// mayarVerifier independently confirms a Mayar transaction is genuinely PAID.
// Implemented by *service.MayarClient; an interface so the gating logic in
// PurchaseWebhookMayar can be unit-tested with a stub.
type mayarVerifier interface {
	VerifyTransactionPaid(ctx context.Context, transactionID string) (bool, error)
}

type CADHandler struct {
	repo        *repository.CADRepo
	auditLog    *repository.AuditLogRepo
	email       *service.EmailService
	mayarSecret string
	mayar       mayarVerifier // outbound callback-verifier (may be nil)
	mayarVerify bool          // when true, REQUIRE callback verification before minting a key
}

func NewCADHandler(repo *repository.CADRepo, auditLog *repository.AuditLogRepo, email *service.EmailService, payments config.PaymentsConfig, mayar mayarVerifier) *CADHandler {
	return &CADHandler{
		repo:        repo,
		auditLog:    auditLog,
		email:       email,
		mayarSecret: payments.MayarWebhookToken,
		mayar:       mayar,
		mayarVerify: payments.MayarVerify,
	}
}

// cadAllowedEvents whitelists telemetry events; unknown events are rejected.
var cadAllowedEvents = map[string]bool{
	"install": true, "app_open": true, "activate": true,
	"download_started": true, "download_completed": true,
	"format_selected": true, "update_applied": true, "crash": true,
}

// ───────────────────────── Admin: licenses ─────────────────────────

func (h *CADHandler) List(c fiber.Ctx) error {
	items, err := h.repo.FindAll(c.Context())
	if err != nil {
		slog.Error("gagal list cad licenses", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	resp := make([]model.CADLicenseResponse, len(items))
	for i := range items {
		resp[i] = items[i].ToResponse()
	}
	return ok(c, resp)
}

func (h *CADHandler) GetByID(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}
	lic, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari cad license", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if lic == nil {
		return errResponse(c, apperr.NewNotFound("Lisensi"))
	}
	return ok(c, lic.ToResponse())
}

// CopyKey returns the full license key (copy-to-clipboard). Audit logged.
func (h *CADHandler) CopyKey(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}
	lic, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari cad license", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if lic == nil {
		return errResponse(c, apperr.NewNotFound("Lisensi"))
	}
	claims := middleware.GetClaims(c)
	desc := "Salin license key CAD"
	idStr := lic.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "copy", "cad_licenses", &idStr, &desc, c.IP())
	return ok(c, fiber.Map{"license_key": lic.LicenseKey})
}

func (h *CADHandler) Create(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	var req model.CreateCADLicenseRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}
	tier := req.Tier
	if tier == "" {
		tier = "lifetime"
	}
	limit := 2
	if req.DeviceLimit != nil {
		limit = *req.DeviceLimit
	}
	lic := model.CADLicense{
		LicenseKey:  req.LicenseKey,
		Email:       req.Email,
		Tier:        tier,
		Status:      "active",
		OrderRef:    req.OrderRef,
		DeviceLimit: limit,
		Notes:       req.Notes,
		CreatedBy:   &claims.UserID,
	}
	if err := h.repo.Create(c.Context(), &lic); err != nil {
		slog.Error("gagal buat cad license", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	desc := "Tambah license CAD"
	idStr := lic.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "create", "cad_licenses", &idStr, &desc, c.IP())
	return created(c, lic.ToResponse())
}

func (h *CADHandler) Update(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}
	existing, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari cad license", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if existing == nil {
		return errResponse(c, apperr.NewNotFound("Lisensi"))
	}
	var req model.UpdateCADLicenseRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if req.Email != nil {
		existing.Email = req.Email
	}
	if req.Tier != nil {
		existing.Tier = *req.Tier
	}
	if req.Status != nil {
		existing.Status = *req.Status
	}
	if req.OrderRef != nil {
		existing.OrderRef = req.OrderRef
	}
	if req.DeviceLimit != nil {
		existing.DeviceLimit = *req.DeviceLimit
	}
	if req.Notes != nil {
		existing.Notes = req.Notes
	}
	if err := h.repo.Update(c.Context(), existing); err != nil {
		slog.Error("gagal update cad license", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	desc := "Update license CAD"
	idStr := existing.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "update", "cad_licenses", &idStr, &desc, c.IP())
	return ok(c, existing.ToResponse())
}

func (h *CADHandler) Delete(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}
	existing, err := h.repo.FindByID(c.Context(), id)
	if err != nil {
		slog.Error("gagal cari cad license", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if existing == nil {
		return errResponse(c, apperr.NewNotFound("Lisensi"))
	}
	if err := h.repo.Delete(c.Context(), id); err != nil {
		slog.Error("gagal hapus cad license", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	desc := "Hapus license CAD"
	idStr := existing.ID.String()
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "delete", "cad_licenses", &idStr, &desc, c.IP())
	return c.Status(fiber.StatusNoContent).Send(nil)
}

// Import bulk-inserts pre-generated keys (skips duplicates).
func (h *CADHandler) Import(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	var req model.ImportCADLicensesRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}
	n, err := h.repo.ImportBatch(c.Context(), req.Keys, req.Tier, &claims.UserID)
	if err != nil {
		slog.Error("gagal import cad licenses", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	desc := fmt.Sprintf("Import %d license CAD", n)
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "import", "cad_licenses", nil, &desc, c.IP())
	return ok(c, fiber.Map{"imported": n, "submitted": len(req.Keys)})
}

// ───────────────────────── Admin: devices + analytics ─────────────────────────

func (h *CADHandler) ListDevices(c fiber.Ctx) error {
	var licenseID *uuid.UUID
	if q := c.Query("license_id"); q != "" {
		if id, err := uuid.Parse(q); err == nil {
			licenseID = &id
		}
	}
	items, err := h.repo.ListInstallations(c.Context(), licenseID, 200)
	if err != nil {
		slog.Error("gagal list cad devices", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	return ok(c, items)
}

func (h *CADHandler) Analytics(c fiber.Ctx) error {
	s, err := h.repo.Summary(c.Context())
	if err != nil {
		slog.Error("gagal cad analytics", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	return ok(c, s)
}

// ───────────────────────── Public (app-facing) ─────────────────────────

// Activate binds a device to a license (online activation; offline verify remains primary).
func (h *CADHandler) Activate(c fiber.Ctx) error {
	var req model.CADActivateRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}
	lic, err := h.repo.FindByKey(c.Context(), req.LicenseKey)
	if err != nil {
		slog.Error("gagal cari license utk aktivasi", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if lic == nil || lic.Status != "active" {
		return errResponse(c, apperr.NewBadRequest("Lisensi tidak valid atau dinonaktifkan"))
	}
	if inst, err := h.repo.FindInstallation(c.Context(), lic.ID, req.DeviceHash); err != nil {
		return errResponse(c, apperr.NewInternal(err))
	} else if inst != nil {
		_ = h.repo.TouchInstallation(c.Context(), inst.ID, req.AppVersion, req.OSVersion)
		return ok(c, fiber.Map{"status": "active", "tier": lic.Tier, "install_id": inst.ID})
	}
	count, _ := h.repo.CountActiveDevices(c.Context(), lic.ID)
	if count >= lic.DeviceLimit {
		return errResponse(c, apperr.NewBadRequest("Batas perangkat tercapai"))
	}
	ni := model.CADInstallation{LicenseID: &lic.ID, DeviceHash: req.DeviceHash, AppVersion: req.AppVersion, OSVersion: req.OSVersion}
	if err := h.repo.CreateInstallation(c.Context(), &ni); err != nil {
		slog.Error("gagal create installation", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	return ok(c, fiber.Map{"status": "active", "tier": lic.Tier, "install_id": ni.ID})
}

// Telemetry ingests one anonymous event. NEVER stores URLs / download history / PII.
func (h *CADHandler) Telemetry(c fiber.Ctx) error {
	var req model.CADTelemetryRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}
	if !cadAllowedEvents[req.EventType] {
		return errResponse(c, apperr.NewBadRequest("event_type tidak dikenal"))
	}
	if err := h.repo.InsertEvent(c.Context(), &req, nil); err != nil {
		slog.Error("gagal insert telemetry", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	return ok(c, fiber.Map{"ok": true})
}

// ───────────────────────── Public (payment webhook) ─────────────────────────

// MayarWebhookPayload mirrors Mayar's webhook body for payment events.
// Docs: https://docs.mayar.id/integration/webhook
// Mayar POSTs application/json with an "event" string and a "data" object.
type MayarWebhookPayload struct {
	Event string `json:"event"`
	Data  struct {
		ID            string          `json:"id"`            // transaction/order id
		Status        json.RawMessage `json:"status"`        // string ("SUCCESS"/"paid") OR boolean — Mayar docs show a boolean; live payloads often a string
		CustomerEmail string          `json:"customerEmail"` // buyer email
		CustomerName  string          `json:"customerName"`
		Amount        int64           `json:"amount"`
		ProductName   string          `json:"productName"`
	} `json:"data"`
}

// statusString normalizes data.status (which Mayar may send as a JSON string or
// boolean) to a lowercase string for comparison.
func (p *MayarWebhookPayload) statusString() string {
	raw := strings.TrimSpace(string(p.Data.Status))
	if raw == "" || raw == "null" {
		return ""
	}
	// Strip surrounding quotes if it's a JSON string literal.
	raw = strings.Trim(raw, `"`)
	return strings.ToLower(strings.TrimSpace(raw))
}

// parseMayarWebhook decodes a Mayar webhook body. Exported-ish (package-level)
// so it can be unit-tested without a live HTTP request.
func parseMayarWebhook(body []byte) (*MayarWebhookPayload, error) {
	var p MayarWebhookPayload
	if err := json.Unmarshal(body, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

// mayarIsPaid reports whether a Mayar event represents a completed payment.
func mayarIsPaid(p *MayarWebhookPayload) bool {
	if !strings.EqualFold(p.Event, "payment.received") {
		return false
	}
	s := p.statusString()
	return s == "" || s == "success" || s == "paid" || s == "settlement" || s == "true"
}

// PurchaseWebhookMayar handles Mayar payment webhooks: on a verified "paid"
// event it claims the next unsold license key and emails it to the buyer.
// Public route (no admin auth) — secured by a shared-secret token instead.
//
// TODO(payments): Confirm Mayar's exact webhook authentication scheme. Mayar's
// public docs (https://docs.mayar.id/integration/webhook) document the payload
// but NOT a request-signature scheme; the only documented auth is the Bearer
// API key used for OUTBOUND calls to Mayar. This handler therefore validates a
// shared secret (MAYAR_WEBHOOK_TOKEN) supplied either as `Authorization: Bearer
// <token>` or the `X-Webhook-Token` header. If Mayar later documents an HMAC
// signature header, replace verifyMayar with constant-time HMAC verification of
// the raw body. Also confirm the "status" field type (string vs boolean) and
// the exact paid value ("SUCCESS"/"paid"); mayarIsPaid currently accepts both.
func (h *CADHandler) PurchaseWebhookMayar(c fiber.Ctx) error {
	if !h.verifyMayar(c) {
		slog.Warn("mayar webhook token tidak valid", "ip", c.IP())
		return errResponse(c, apperr.NewUnauthorized("Token webhook tidak valid"))
	}

	payload, err := parseMayarWebhook(c.Body())
	if err != nil {
		slog.Warn("mayar webhook payload tidak valid", "error", err)
		return errResponse(c, apperr.NewBadRequest("Payload webhook Mayar tidak valid"))
	}

	// Acknowledge non-payment / non-paid events quickly so Mayar stops retrying.
	if !mayarIsPaid(payload) {
		return ok(c, fiber.Map{"received": true, "ignored": true})
	}

	email := strings.TrimSpace(payload.Data.CustomerEmail)
	orderRef := strings.TrimSpace(payload.Data.ID)
	if email == "" || orderRef == "" {
		slog.Error("mayar webhook paid tapi email/order id kosong", "order_ref", orderRef, "has_email", email != "")
		// Nothing actionable; ack so Mayar doesn't retry forever.
		return ok(c, fiber.Map{"received": true, "ignored": true})
	}

	// Callback-verification (defense against spoofed "paid" webhooks): when
	// MAYAR_VERIFY=true, independently confirm with Mayar's API that this
	// transaction is genuinely PAID before any key is minted. On false/error we
	// REJECT (no key assigned) and ack with 200 so Mayar stops retrying.
	// When MAYAR_VERIFY=false the path is unchanged (current prod behaviour).
	if !h.callbackVerified(c.Context(), orderRef, email) {
		return ok(c, fiber.Map{"received": true, "verified": false})
	}

	lic, err := h.repo.AssignNextUnsoldLicense(c.Context(), email, orderRef)
	if err != nil {
		slog.Error("gagal assign license CAD utk pembelian", "order_ref", orderRef, "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if lic == nil {
		// Pool exhausted — needs a human to top up keys. Ack so Mayar stops retrying.
		slog.Error("STOK LICENSE KEY CAD HABIS — pembelian tidak bisa dipenuhi otomatis, perlu tindakan manual",
			"order_ref", orderRef, "email", email, "amount", payload.Data.Amount)
		return ok(c, fiber.Map{"received": true, "fulfilled": false})
	}

	if err := h.email.SendLicenseKey(c.Context(), email, lic.LicenseKey, cadDownloadURL); err != nil {
		// Key is already assigned (idempotent on retry); log loudly but ack.
		slog.Error("gagal kirim email license key CAD", "order_ref", orderRef, "email", email, "error", err)
		return ok(c, fiber.Map{"received": true, "fulfilled": true, "emailed": false})
	}

	slog.Info("license key CAD terkirim", "order_ref", orderRef, "email", email, "license_id", lic.ID)
	return ok(c, fiber.Map{"received": true, "fulfilled": true, "emailed": true})
}

// callbackVerified reports whether the order may proceed to key assignment.
//
//   - MAYAR_VERIFY off  → always true (behaviour unchanged; current prod path).
//   - MAYAR_VERIFY on   → true only when Mayar's API independently confirms the
//     transaction is genuinely PAID. Any false/error/missing-client → false
//     (fail closed: no key minted). Pure enough to unit-test with a stub.
func (h *CADHandler) callbackVerified(ctx context.Context, orderRef, email string) bool {
	if !h.mayarVerify {
		return true
	}
	if h.mayar == nil {
		slog.Error("MAYAR_VERIFY aktif tapi MayarClient tidak tersedia — tolak (fail closed)", "order_ref", orderRef)
		return false
	}
	paid, err := h.mayar.VerifyTransactionPaid(ctx, orderRef)
	if err != nil {
		slog.Error("verifikasi callback Mayar gagal — tolak (tidak assign key)", "order_ref", orderRef, "error", err)
		return false
	}
	if !paid {
		slog.Warn("verifikasi callback Mayar: transaksi TIDAK lunas — tolak (kemungkinan webhook palsu)", "order_ref", orderRef, "email", email)
		return false
	}
	slog.Info("verifikasi callback Mayar lolos", "order_ref", orderRef)
	return true
}

// verifyMayar checks the shared-secret token (see TODO on PurchaseWebhookMayar).
// If no secret is configured, the webhook is rejected (fail closed).
func (h *CADHandler) verifyMayar(c fiber.Ctx) bool {
	secret := strings.TrimSpace(h.mayarSecret)
	if secret == "" {
		slog.Warn("MAYAR_WEBHOOK_TOKEN belum dikonfigurasi — webhook ditolak (fail closed)")
		return false
	}
	got := strings.TrimSpace(c.Get("X-Webhook-Token"))
	if got == "" {
		got = strings.TrimSpace(strings.TrimPrefix(c.Get("Authorization"), "Bearer "))
	}
	if got == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(got), []byte(secret)) == 1
}
