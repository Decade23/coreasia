package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/model"
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

// SendLicenseKey emails the buyer their license key + download link + activation
// steps. productName is the display name shown in the subject/body (e.g.
// "CoreAsia Download Manager", "CoreAsia Mounter"); empty falls back to CAD for
// backward compatibility.
func (s *EmailService) SendLicenseKey(ctx context.Context, toEmail, licenseKey, downloadURL, productName string) error {
	if !s.IsConfigured() {
		slog.Warn("email service tidak dikonfigurasi (RESEND_API_KEY kosong), lewati kirim license key", "to", toEmail)
		return nil
	}
	if productName == "" {
		productName = "CoreAsia Download Manager"
	}

	subject := fmt.Sprintf("Lisensi %s Anda / Your License Key", productName)

	reqBody := resendEmailRequest{
		From:    s.cfg.From,
		To:      []string{toEmail},
		Subject: subject,
		HTML:    licenseKeyHTML(licenseKey, downloadURL, productName),
		Text:    licenseKeyText(licenseKey, downloadURL, productName),
	}
	return s.send(ctx, reqBody)
}

// SendContactLeadNotification alerts the configured sales inbox after a lead
// has already been persisted. An empty API key/recipient is a safe no-op.
func (s *EmailService) SendContactLeadNotification(ctx context.Context, lead *model.ContactLead) error {
	if !s.IsConfigured() {
		slog.Warn("email service tidak dikonfigurasi (RESEND_API_KEY kosong), lewati notifikasi lead", "lead_id", lead.ID)
		return nil
	}

	recipient := strings.TrimSpace(s.cfg.LeadNotificationEmail)
	if recipient == "" {
		slog.Warn("LEAD_NOTIFICATION_EMAIL kosong, lewati notifikasi lead", "lead_id", lead.ID)
		return nil
	}

	subject := strings.ReplaceAll(strings.ReplaceAll(lead.Subject, "\r", " "), "\n", " ")
	reqBody := resendEmailRequest{
		From:    s.cfg.From,
		To:      []string{recipient},
		Subject: "[Lead Baru CoreAsia] " + subject,
		HTML:    contactLeadHTML(lead),
		Text:    contactLeadText(lead),
	}
	return s.send(ctx, reqBody)
}

func (s *EmailService) send(ctx context.Context, reqBody resendEmailRequest) error {

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

func contactLeadHTML(lead *model.ContactLead) string {
	value := func(input *string) string {
		if input == nil || strings.TrimSpace(*input) == "" {
			return "-"
		}
		return html.EscapeString(*input)
	}
	createdAt := lead.CreatedAt.Format(time.RFC3339)
	if lead.CreatedAt.IsZero() {
		createdAt = "-"
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2329;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <h1 style="font-size:20px;margin:0 0 20px;">Lead baru dari coreasia.id</h1>
    <table style="width:100%%;border-collapse:collapse;font-size:14px;line-height:1.6;">
      <tr><td style="padding:5px 12px 5px 0;color:#6b7280;">Lead ID</td><td>%s</td></tr>
      <tr><td style="padding:5px 12px 5px 0;color:#6b7280;">Nama</td><td>%s</td></tr>
      <tr><td style="padding:5px 12px 5px 0;color:#6b7280;">Email</td><td>%s</td></tr>
      <tr><td style="padding:5px 12px 5px 0;color:#6b7280;">WhatsApp</td><td>%s</td></tr>
      <tr><td style="padding:5px 12px 5px 0;color:#6b7280;">Subjek</td><td>%s</td></tr>
      <tr><td style="padding:5px 12px 5px 0;color:#6b7280;">Anggaran</td><td><strong>%s</strong></td></tr>
      <tr><td style="padding:5px 12px 5px 0;color:#6b7280;">Diterima</td><td>%s</td></tr>
    </table>
    <h2 style="font-size:15px;margin:24px 0 8px;">Kebutuhan</h2>
    <div style="white-space:pre-wrap;background:#f8fafc;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;">%s</div>
    <h2 style="font-size:15px;margin:24px 0 8px;">Attribution</h2>
    <table style="width:100%%;border-collapse:collapse;font-size:13px;line-height:1.6;">
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Source / Medium</td><td>%s / %s</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Campaign</td><td>%s</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Term</td><td>%s</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Content</td><td>%s</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">GCLID</td><td style="word-break:break-all;">%s</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">FBCLID</td><td style="word-break:break-all;">%s</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Landing page</td><td style="word-break:break-all;">%s</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Referrer</td><td style="word-break:break-all;">%s</td></tr>
    </table>
  </div>
</body>
</html>`,
		html.EscapeString(lead.ID.String()),
		html.EscapeString(lead.Name),
		html.EscapeString(lead.Email),
		value(lead.Phone),
		html.EscapeString(lead.Subject),
		html.EscapeString(budgetLabel(lead.BudgetRange)),
		html.EscapeString(createdAt),
		html.EscapeString(lead.Message),
		value(lead.UTMSource),
		value(lead.UTMMedium),
		value(lead.UTMCampaign),
		value(lead.UTMTerm),
		value(lead.UTMContent),
		value(lead.GCLID),
		value(lead.FBCLID),
		value(lead.LandingPage),
		value(lead.Referrer),
	)
}

// budgetLabel mengubah kunci rentang anggaran menjadi teks yang dibaca tim
// sales. Kunci tak dikenal dikembalikan apa adanya agar data tetap terlihat
// bila daftar pilihan di formulir bertambah lebih dulu daripada gateway.
func budgetLabel(input *string) string {
	if input == nil || strings.TrimSpace(*input) == "" {
		return "Tidak diisi"
	}
	key := strings.TrimSpace(*input)
	if label, ok := model.BudgetRangeLabels[key]; ok {
		return label
	}
	return key
}

func contactLeadText(lead *model.ContactLead) string {
	value := func(input *string) string {
		if input == nil || strings.TrimSpace(*input) == "" {
			return "-"
		}
		return *input
	}
	createdAt := lead.CreatedAt.Format(time.RFC3339)
	if lead.CreatedAt.IsZero() {
		createdAt = "-"
	}

	return fmt.Sprintf(`Lead baru dari coreasia.id

Lead ID: %s
Nama: %s
Email: %s
WhatsApp: %s
Subjek: %s
Anggaran: %s
Diterima: %s

Kebutuhan:
%s

Attribution:
Source / Medium: %s / %s
Campaign: %s
Term: %s
Content: %s
GCLID: %s
FBCLID: %s
Landing page: %s
Referrer: %s`,
		lead.ID,
		lead.Name,
		lead.Email,
		value(lead.Phone),
		lead.Subject,
		budgetLabel(lead.BudgetRange),
		createdAt,
		lead.Message,
		value(lead.UTMSource),
		value(lead.UTMMedium),
		value(lead.UTMCampaign),
		value(lead.UTMTerm),
		value(lead.UTMContent),
		value(lead.GCLID),
		value(lead.FBCLID),
		value(lead.LandingPage),
		value(lead.Referrer),
	)
}

func licenseKeyHTML(licenseKey, downloadURL, productName string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2329;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <h1 style="font-size:20px;margin:0 0 16px;">Terima kasih sudah membeli %[3]s</h1>
    <p style="font-size:14px;line-height:1.6;margin:0 0 8px;">Berikut license key Anda. Simpan baik-baik.</p>
    <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 16px;"><em>Thank you for your purchase. Below is your license key — please keep it safe.</em></p>

    <div style="background:#0f172a;color:#e2e8f0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:14px;padding:16px;border-radius:8px;word-break:break-all;margin:0 0 24px;">%[1]s</div>

    <p style="font-size:14px;line-height:1.6;margin:0 0 8px;"><strong>Unduh aplikasi / Download the app:</strong></p>
    <p style="margin:0 0 24px;">
      <a href="%[2]s" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">Unduh %[3]s</a>
    </p>

    <p style="font-size:14px;line-height:1.6;margin:0 0 4px;"><strong>Cara aktivasi / How to activate:</strong></p>
    <ol style="font-size:14px;line-height:1.7;margin:0 0 8px;padding-left:20px;">
      <li>Buka aplikasi %[3]s.</li>
      <li>Klik <strong>Activate</strong>, lalu tempel (paste) license key di atas.</li>
      <li>Selesai — aplikasi aktif di perangkat Anda.</li>
    </ol>
    <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0 0 24px;"><em>Open the app, click Activate, paste the key above. Done.</em></p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;" />
    <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0;">CoreAsia — PT Inti Asia Teknologi. Butuh bantuan? Balas email ini.</p>
  </div>
</body>
</html>`, licenseKey, downloadURL, productName)
}

func licenseKeyText(licenseKey, downloadURL, productName string) string {
	return fmt.Sprintf(`Terima kasih sudah membeli %[3]s.
(Thank you for your purchase.)

License key Anda / Your license key:
%[1]s

Unduh aplikasi / Download the app:
%[2]s

Cara aktivasi / How to activate:
1. Buka aplikasi %[3]s.
2. Klik Activate, lalu tempel (paste) license key di atas.
3. Selesai.

CoreAsia — PT Inti Asia Teknologi. Butuh bantuan? Balas email ini.`, licenseKey, downloadURL, productName)
}
