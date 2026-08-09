package service

import (
	"context"
	"html"
	"strings"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
)

func TestEmailServiceNoopWithoutKey(t *testing.T) {
	s := NewEmailService(config.EmailConfig{}) // no API key
	if s.IsConfigured() {
		t.Fatal("expected IsConfigured() = false when APIKey empty")
	}
	// Must be a no-op (return nil), never attempt a network call.
	if err := s.SendLicenseKey(context.Background(), "buyer@example.com", "CAD-XYZ", "https://example.com/app.dmg", "CoreAsia Download Manager"); err != nil {
		t.Fatalf("expected nil (no-op) without API key, got %v", err)
	}
}

func TestContactLeadTemplatesContainLeadAndEscapeHTML(t *testing.T) {
	phone := "+628123456789"
	campaign := "website-search"
	lead := &model.ContactLead{
		ID:          uuid.New(),
		Name:        `<script>alert("x")</script> Budi`,
		Email:       "budi@example.com",
		Phone:       &phone,
		Subject:     "website",
		Message:     "Butuh website <strong>baru</strong>",
		UTMCampaign: &campaign,
		CreatedAt:   time.Date(2026, time.August, 9, 8, 0, 0, 0, time.UTC),
	}

	htmlBody := contactLeadHTML(lead)
	if strings.Contains(htmlBody, lead.Name) || strings.Contains(htmlBody, lead.Message) {
		t.Fatal("HTML notification contains unescaped lead input")
	}
	if !strings.Contains(htmlBody, html.EscapeString(lead.Name)) || !strings.Contains(htmlBody, html.EscapeString(lead.Message)) {
		t.Fatal("HTML notification is missing escaped lead input")
	}
	if !strings.Contains(htmlBody, campaign) || !strings.Contains(htmlBody, lead.ID.String()) {
		t.Fatal("HTML notification is missing attribution or lead ID")
	}

	textBody := contactLeadText(lead)
	for _, want := range []string{lead.Name, lead.Email, phone, lead.Message, campaign, lead.ID.String()} {
		if !strings.Contains(textBody, want) {
			t.Fatalf("text notification missing %q", want)
		}
	}
}

func TestLicenseKeyTemplatesContainKeyAndLink(t *testing.T) {
	key := "CAD-TEST-KEY-123"
	link := "https://assets.coreasia.id/CoreAsia-Download-Manager.dmg"

	for _, product := range []string{"CoreAsia Download Manager", "CoreAsia Mounter"} {
		html := licenseKeyHTML(key, link, product)
		if !strings.Contains(html, key) {
			t.Fatal("HTML email missing license key")
		}
		if !strings.Contains(html, link) {
			t.Fatal("HTML email missing download link")
		}
		if !strings.Contains(html, "Activate") {
			t.Fatal("HTML email missing activation instruction")
		}
		if !strings.Contains(html, product) {
			t.Fatalf("HTML email missing product name %q", product)
		}

		text := licenseKeyText(key, link, product)
		if !strings.Contains(text, key) || !strings.Contains(text, link) {
			t.Fatal("text email missing key or link")
		}
		if !strings.Contains(text, product) {
			t.Fatalf("text email missing product name %q", product)
		}
	}
}
