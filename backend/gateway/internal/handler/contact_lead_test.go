package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type fakeContactLeadStore struct {
	id      uuid.UUID
	err     error
	created *model.ContactLead
	calls   int
}

type fakeContactLeadNotifier struct {
	err      error
	received chan model.ContactLead
}

func (f *fakeContactLeadNotifier) SendContactLeadNotification(_ context.Context, lead *model.ContactLead) error {
	if f.received != nil {
		f.received <- *lead
	}
	return f.err
}

func (f *fakeContactLeadStore) Create(_ context.Context, lead *model.ContactLead) error {
	f.calls++
	if f.err != nil {
		return f.err
	}

	copyOfLead := *lead
	f.created = &copyOfLead
	lead.ID = f.id
	lead.Status = model.ContactLeadStatusNew
	lead.ConsentedAt = time.Now()
	lead.CreatedAt = time.Now()
	lead.UpdatedAt = lead.CreatedAt
	return nil
}

func newContactLeadTestApp(store contactLeadStore) *fiber.App {
	h := &ContactLeadHandler{repo: store}
	app := fiber.New(fiber.Config{ErrorHandler: globalErrorHandler})
	app.Post("/api/public/leads", h.Create)
	return app
}

func newRateLimitedContactLeadTestApp(store contactLeadStore, limit int) *fiber.App {
	h := &ContactLeadHandler{repo: store}
	limiter := mw.NewIPRateLimiter(limit, time.Hour, false)
	app := fiber.New(fiber.Config{ErrorHandler: globalErrorHandler})
	app.Post("/api/public/leads", limiter.Middleware(), h.Create)
	return app
}

func postContactLead(t *testing.T, app *fiber.App, body any, headers map[string]string) (*http.Response, map[string]any) {
	t.Helper()

	payload, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/api/public/leads", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := app.Test(req, fiber.TestConfig{Timeout: 5 * time.Second})
	if err != nil {
		t.Fatalf("app.Test error: %v", err)
	}

	var parsed map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return resp, parsed
}

func validContactLeadPayload() map[string]any {
	return map[string]any{
		"name":         "Budi Santoso",
		"email":        "budi@example.com",
		"phone":        "+62 812 3456 7890",
		"subject":      "website",
		"message":      "Saya membutuhkan website company profile.",
		"consent":      true,
		"utm_source":   "google",
		"utm_medium":   "cpc",
		"utm_campaign": "website-jakarta",
		"utm_content":  "responsive-search-ad-a",
		"utm_term":     "jasa website perusahaan",
		"gclid":        "test-gclid",
		"fbclid":       "test-fbclid",
		"landing_page": "https://coreasia.id/contact?utm_source=google",
		"referrer":     "https://www.google.com/",
	}
}

func TestContactLeadCreatePersistsNormalizedPayload(t *testing.T) {
	leadID := uuid.New()
	store := &fakeContactLeadStore{id: leadID}
	app := newContactLeadTestApp(store)
	payload := validContactLeadPayload()
	payload["name"] = "  Budi Santoso  "
	payload["email"] = "  BUDI@EXAMPLE.COM  "
	payload["utm_campaign"] = "  website-jakarta  "

	resp, parsed := postContactLead(t, app, payload, nil)

	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body=%v", resp.StatusCode, parsed)
	}
	if parsed["success"] != true {
		t.Fatalf("success = %v, want true", parsed["success"])
	}
	if parsed["lead_id"] != leadID.String() {
		t.Fatalf("lead_id = %v, want %s", parsed["lead_id"], leadID)
	}
	if parsed["status"] != model.ContactLeadStatusNew {
		t.Fatalf("status = %v, want new", parsed["status"])
	}
	if store.created == nil {
		t.Fatal("repository Create was not called")
	}
	if store.created.Name != "Budi Santoso" {
		t.Fatalf("stored name = %q", store.created.Name)
	}
	if store.created.Email != "budi@example.com" {
		t.Fatalf("stored email = %q", store.created.Email)
	}
	if store.created.UTMCampaign == nil || *store.created.UTMCampaign != "website-jakarta" {
		t.Fatalf("stored campaign = %v", store.created.UTMCampaign)
	}
}

func TestContactLeadCreateUsesRefererHeaderFallback(t *testing.T) {
	store := &fakeContactLeadStore{id: uuid.New()}
	app := newContactLeadTestApp(store)
	payload := validContactLeadPayload()
	delete(payload, "referrer")

	resp, parsed := postContactLead(t, app, payload, map[string]string{
		"Referer": "https://coreasia.id/layanan/jasa-pembuatan-website",
	})

	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body=%v", resp.StatusCode, parsed)
	}
	if store.created.Referrer == nil || *store.created.Referrer != "https://coreasia.id/layanan/jasa-pembuatan-website" {
		t.Fatalf("stored referrer = %v", store.created.Referrer)
	}
}

func TestContactLeadCreateRejectsInvalidInput(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(map[string]any)
	}{
		{
			name: "consent is required",
			mutate: func(payload map[string]any) {
				payload["consent"] = false
			},
		},
		{
			name: "email must be valid",
			mutate: func(payload map[string]any) {
				payload["email"] = "not-an-email"
			},
		},
		{
			name: "whitespace-only name is rejected after normalization",
			mutate: func(payload map[string]any) {
				payload["name"] = "   "
			},
		},
		{
			name: "oversized attribution is rejected",
			mutate: func(payload map[string]any) {
				payload["utm_campaign"] = strings.Repeat("x", 256)
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			store := &fakeContactLeadStore{id: uuid.New()}
			app := newContactLeadTestApp(store)
			payload := validContactLeadPayload()
			tc.mutate(payload)

			resp, parsed := postContactLead(t, app, payload, nil)

			if resp.StatusCode != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400; body=%v", resp.StatusCode, parsed)
			}
			if store.created != nil {
				t.Fatal("repository must not be called for invalid payload")
			}
		})
	}
}

func TestContactLeadCreateDoesNotReportSuccessWhenPersistenceFails(t *testing.T) {
	store := &fakeContactLeadStore{err: errors.New("database unavailable")}
	app := newContactLeadTestApp(store)

	resp, parsed := postContactLead(t, app, validContactLeadPayload(), nil)

	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500; body=%v", resp.StatusCode, parsed)
	}
	if parsed["success"] == true {
		t.Fatalf("success must not be true on persistence error: %v", parsed)
	}
	errorsBody, ok := parsed["errors"].(map[string]any)
	if !ok || errorsBody["code"] != "INTERNAL_ERROR" {
		t.Fatalf("unexpected error response: %v", parsed)
	}
}

func TestContactLeadCreateNotifiesAfterPersistence(t *testing.T) {
	leadID := uuid.New()
	store := &fakeContactLeadStore{id: leadID}
	notifier := &fakeContactLeadNotifier{received: make(chan model.ContactLead, 1)}
	h := &ContactLeadHandler{repo: store, notifier: notifier}
	app := fiber.New(fiber.Config{ErrorHandler: globalErrorHandler})
	app.Post("/api/public/leads", h.Create)

	resp, parsed := postContactLead(t, app, validContactLeadPayload(), nil)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body=%v", resp.StatusCode, parsed)
	}

	select {
	case notified := <-notifier.received:
		if notified.ID != leadID {
			t.Fatalf("notified lead ID = %s, want %s", notified.ID, leadID)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for lead notification")
	}
}

func TestContactLeadNotificationFailureDoesNotChangeCreatedResponse(t *testing.T) {
	store := &fakeContactLeadStore{id: uuid.New()}
	notifier := &fakeContactLeadNotifier{
		err:      errors.New("resend unavailable"),
		received: make(chan model.ContactLead, 1),
	}
	h := &ContactLeadHandler{repo: store, notifier: notifier}
	app := fiber.New(fiber.Config{ErrorHandler: globalErrorHandler})
	app.Post("/api/public/leads", h.Create)

	resp, parsed := postContactLead(t, app, validContactLeadPayload(), nil)
	if resp.StatusCode != http.StatusCreated || parsed["success"] != true {
		t.Fatalf("notification failure changed response: status=%d body=%v", resp.StatusCode, parsed)
	}

	select {
	case <-notifier.received:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for failing notification attempt")
	}
}

func TestContactLeadCreateIsRateLimitedPerIP(t *testing.T) {
	store := &fakeContactLeadStore{id: uuid.New()}
	app := newRateLimitedContactLeadTestApp(store, 2)

	for attempt := 1; attempt <= 2; attempt++ {
		resp, parsed := postContactLead(t, app, validContactLeadPayload(), nil)
		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("attempt %d status = %d, want 201; body=%v", attempt, resp.StatusCode, parsed)
		}
	}

	resp, parsed := postContactLead(t, app, validContactLeadPayload(), nil)
	if resp.StatusCode != http.StatusTooManyRequests {
		t.Fatalf("third attempt status = %d, want 429; body=%v", resp.StatusCode, parsed)
	}
	if store.calls != 2 {
		t.Fatalf("repository calls = %d, want 2", store.calls)
	}
	errorsBody, ok := parsed["errors"].(map[string]any)
	if !ok || errorsBody["code"] != "TOO_MANY_REQUESTS" {
		t.Fatalf("unexpected rate-limit response: %v", parsed)
	}
}

func TestContactLeadCreateRejectsMalformedJSON(t *testing.T) {
	store := &fakeContactLeadStore{id: uuid.New()}
	app := newContactLeadTestApp(store)
	req := httptest.NewRequest(http.MethodPost, "/api/public/leads", strings.NewReader(`{"name":`))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req, fiber.TestConfig{Timeout: 5 * time.Second})
	if err != nil {
		t.Fatalf("app.Test error: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.StatusCode)
	}
	if store.created != nil {
		t.Fatal("repository must not be called for malformed JSON")
	}
}
