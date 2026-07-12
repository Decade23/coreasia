package service

import (
	"context"
	"strings"
	"testing"

	"github.com/coreasia/gateway/internal/config"
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
