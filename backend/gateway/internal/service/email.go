package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/config"
)

// EmailService sends transactional email via the Resend REST API.
// If APIKey is empty it becomes a no-op (logs a warning), so dev/test never break.
type EmailService struct {
	cfg    config.EmailConfig
	client *http.Client
}

func NewEmailService(cfg config.EmailConfig) *EmailService {
	return &EmailService{
		cfg: cfg,
		client: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

// IsConfigured reports whether an API key is set.
func (s *EmailService) IsConfigured() bool {
	return strings.TrimSpace(s.cfg.APIKey) != ""
}

type resendEmailRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
	Text    string   `json:"text"`
}

type resendErrorResponse struct {
	Name    string `json:"name"`
	Message string `json:"message"`
}

// SendLicenseKey emails the buyer their CAD license key + download link + activation steps.
func (s *EmailService) SendLicenseKey(ctx context.Context, toEmail, licenseKey, downloadURL string) error {
	if !s.IsConfigured() {
		slog.Warn("email service tidak dikonfigurasi (RESEND_API_KEY kosong), lewati kirim license key", "to", toEmail)
		return nil
	}

	subject := "Lisensi CoreAsia Download Manager Anda / Your License Key"

	reqBody := resendEmailRequest{
		From:    s.cfg.From,
		To:      []string{toEmail},
		Subject: subject,
		HTML:    licenseKeyHTML(licenseKey, downloadURL),
		Text:    licenseKeyText(licenseKey, downloadURL),
	}

	payload, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("marshal resend request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create resend request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(s.cfg.APIKey))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("resend request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var apiErr resendErrorResponse
		if json.Unmarshal(body, &apiErr) == nil && apiErr.Message != "" {
			return fmt.Errorf("resend error (%s): %s", apiErr.Name, apiErr.Message)
		}
		return fmt.Errorf("resend error (%d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	return nil
}

func licenseKeyHTML(licenseKey, downloadURL string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2329;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <h1 style="font-size:20px;margin:0 0 16px;">Terima kasih sudah membeli CoreAsia Download Manager</h1>
    <p style="font-size:14px;line-height:1.6;margin:0 0 8px;">Berikut license key Anda. Simpan baik-baik.</p>
    <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 16px;"><em>Thank you for your purchase. Below is your license key — please keep it safe.</em></p>

    <div style="background:#0f172a;color:#e2e8f0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:14px;padding:16px;border-radius:8px;word-break:break-all;margin:0 0 24px;">%s</div>

    <p style="font-size:14px;line-height:1.6;margin:0 0 8px;"><strong>Unduh aplikasi / Download the app:</strong></p>
    <p style="margin:0 0 24px;">
      <a href="%s" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">Unduh CoreAsia Download Manager</a>
    </p>

    <p style="font-size:14px;line-height:1.6;margin:0 0 4px;"><strong>Cara aktivasi / How to activate:</strong></p>
    <ol style="font-size:14px;line-height:1.7;margin:0 0 8px;padding-left:20px;">
      <li>Buka aplikasi CoreAsia Download Manager.</li>
      <li>Klik <strong>Activate</strong>, lalu tempel (paste) license key di atas.</li>
      <li>Selesai — aplikasi aktif di perangkat Anda.</li>
    </ol>
    <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 24px;"><em>Open the app, click Activate, paste the key above. Done.</em></p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;" />
    <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0;">CoreAsia — PT Inti Asia Teknologi. Butuh bantuan? Balas email ini.</p>
  </div>
</body>
</html>`, licenseKey, downloadURL)
}

func licenseKeyText(licenseKey, downloadURL string) string {
	return fmt.Sprintf(`Terima kasih sudah membeli CoreAsia Download Manager.
(Thank you for your purchase.)

License key Anda / Your license key:
%s

Unduh aplikasi / Download the app:
%s

Cara aktivasi / How to activate:
1. Buka aplikasi CoreAsia Download Manager.
2. Klik Activate, lalu tempel (paste) license key di atas.
3. Selesai.

CoreAsia — PT Inti Asia Teknologi. Butuh bantuan? Balas email ini.`, licenseKey, downloadURL)
}
