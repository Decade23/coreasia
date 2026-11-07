package handler

import (
	"context"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/coreasia/gateway/internal/model"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

func TestLeadkuTelemetryRejectsUnknownAppsAndPrivateResourceIdentifiers(t *testing.T) {
	p := model.LeadkuMobilePulse{UsageConsent: true, InstallationID: uuid.NewString(), Package: "id.coreasia.leadku", AppVersion: "1.6.3", VersionCode: 13, OSVersion: "17", Events: []model.LeadkuMobileEvent{{ID: uuid.NewString(), Kind: "screen_view", Screen: "contacts"}}}
	if !validLeadkuPulse(p) {
		t.Fatal("valid pulse rejected")
	}
	p.Package = "another.app"
	if validLeadkuPulse(p) {
		t.Fatal("unknown application accepted")
	}
	p.Package = "id.coreasia.leadku.qa.prod"
	p.Events[0].Screen = "contacts/private-record-id"
	if validLeadkuPulse(p) {
		t.Fatal("resource path accepted")
	}
	p.Events[0].Screen = "contacts"
	p.VersionCode = -1
	if validLeadkuPulse(p) {
		t.Fatal("invalid version accepted")
	}
}
func TestLeadkuPolicyCannotForceUnavailableOrInvalidVersion(t *testing.T) {
	p := model.LeadkuMobilePolicy{Channel: "production", LatestCode: 13, LatestVersion: "1.6.3", MinimumCode: 0, Available: false}
	if !validLeadkuPolicy(p) {
		t.Fatal("draft release rejected")
	}
	p.MinimumCode = 13
	if validLeadkuPolicy(p) {
		t.Fatal("unavailable forced release accepted")
	}
	p.Available = true
	if !validLeadkuPolicy(p) {
		t.Fatal("available forced release rejected")
	}
	p.MinimumCode = 14
	if validLeadkuPolicy(p) {
		t.Fatal("minimum above latest accepted")
	}
}

func TestLeadkuAutomaticReportingAndLegacyOptIn(t *testing.T) {
	p := model.LeadkuMobilePulse{CollectionMode: "automatic", InstallationID: uuid.NewString(), Package: "id.coreasia.leadku.qa.prod", AppVersion: "1.6.3", VersionCode: 14, OSVersion: "17", Events: []model.LeadkuMobileEvent{{ID: uuid.NewString(), Kind: "session_start"}}}
	if !validLeadkuPulse(p) {
		t.Fatal("automatic reporting rejected")
	}
	p.CollectionMode = "unknown"
	p.UsageConsent = true
	if validLeadkuPulse(p) {
		t.Fatal("unknown collection mode accepted")
	}
	p.CollectionMode = ""
	if !validLeadkuPulse(p) {
		t.Fatal("legacy opt-in rejected")
	}
	p.UsageConsent = false
	if validLeadkuPulse(p) {
		t.Fatal("unidentified reporting mode accepted")
	}
}

func TestLeadkuFunnelPulseOnlyAcceptsAnonymousActions(t *testing.T) {
	p := model.LeadkuMobilePulse{
		CollectionMode: "automatic", InstallationID: uuid.NewString(), Package: "id.coreasia.leadku.qa.prod", AppVersion: "1.6.4", VersionCode: 17, OSVersion: "17",
		Events: []model.LeadkuMobileEvent{{ID: uuid.NewString(), Kind: "first_open"}, {ID: uuid.NewString(), Kind: "demo_key_action", Screen: "pipeline"}},
	}
	if !validLeadkuPulse(p) {
		t.Fatal("allowlisted milestones rejected")
	}
	p.Events[1].Screen = "contact"
	if validLeadkuPulse(p) {
		t.Fatal("unexpected action screen accepted")
	}
	p.Events[1].Kind, p.Events[1].Screen = "signup_completed", ""
	if validLeadkuPulse(p) {
		t.Fatal("pulse marked signup completed without verification bridge")
	}
}

type leadkuFunnelTestStore struct {
	leadkuMobileStore
	ref string
}

func (s *leadkuFunnelTestStore) CompleteSignup(_ context.Context, ref string) (bool, error) {
	s.ref = ref
	return true, nil
}

func TestLeadkuSignupCompletionRequiresBridge(t *testing.T) {
	ref := uuid.NewString()
	secret := strings.Repeat("test", 8)
	for _, tc := range []struct {
		name, configured, provided string
		status                     int
	}{
		{"disabled", "", "", 503},
		{"missing credentials", secret, "", 401},
		{"incorrect credentials", secret, "Bearer " + strings.Repeat("wrong", 8), 401},
		{"authenticated bridge", secret, "Bearer " + secret, 200},
	} {
		t.Run(tc.name, func(t *testing.T) {
			store := &leadkuFunnelTestStore{}
			h := &LeadkuMobileHandler{repo: store, funnelBridgeSecret: tc.configured}
			app := fiber.New()
			app.Post("/signup-completed", h.CompleteSignup)
			r := httptest.NewRequest("POST", "/signup-completed", strings.NewReader(`{"ref":"`+ref+`"}`))
			r.Header.Set("Authorization", tc.provided)
			res, err := app.Test(r)
			if err != nil {
				t.Fatal(err)
			}
			defer res.Body.Close()
			if res.StatusCode != tc.status || res.Header.Get("Cache-Control") != "no-store" || (store.ref == ref) != (tc.status == 200) {
				t.Fatalf("completion authentication/status mismatch: %d", res.StatusCode)
			}
		})
	}
}

func TestLeadkuSetupContactAcceptsOnlyUsableAddresses(t *testing.T) {
	for _, tc := range []struct{ channel, input, want string }{
		{"email", " Contoh@Example.Invalid ", "contoh@example.invalid"},
		{"email", "Contoh <dummy@example.invalid>", ""},
		{"email", "dummy@example.invalid\nBcc: bad@example.invalid", ""},
		{"email", "dummy", ""},
		{"whatsapp", "+628123456789", "+628123456789"},
		{"whatsapp", "628123456789", ""},
		{"whatsapp", "+628123456789?text=spam", ""},
	} {
		got, ok := normalizeLeadkuSetupContact(tc.channel, tc.input)
		if got != tc.want || ok != (tc.want != "") {
			t.Fatalf("unexpected validation for %q: %q, %t", tc.input, got, ok)
		}
	}
}
