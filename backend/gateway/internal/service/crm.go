package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/model"
)

// CRMService meneruskan lead formulir kontak ke pipeline LeadKu di workspace
// CoreAsia, sehingga setiap penanya langsung menjadi contact dan deal yang bisa
// ditindaklanjuti, bukan sekadar baris di database dan satu email yang mudah
// tenggelam di kotak masuk.
//
// Penerusan ini SELALU bersifat pelengkap. Lead sudah tersimpan sebelum
// pemanggilan, dan email notifikasi berjalan di jalur terpisah. LeadKu berada di
// VPS lain dengan database lain, jadi dia bisa mati tanpa boleh ikut
// menjatuhkan formulir kontak coreasia.id.
type CRMService struct {
	cfg    config.CRMConfig
	client *http.Client
}

func NewCRMService(cfg config.CRMConfig) *CRMService {
	return &CRMService{
		cfg: cfg,
		// Timeout pendek disengaja. Pemanggilan ini berjalan di goroutine
		// terpisah, tetapi tetap memakai koneksi dan memori; membiarkannya
		// menggantung saat LeadKu lambat hanya menumpuk goroutine tanpa
		// menambah satu pun lead yang tertolong.
		client: &http.Client{Timeout: 8 * time.Second},
	}
}

// IsConfigured melaporkan apakah penerusan CRM aktif. Keduanya wajib terisi:
// URL tanpa token akan ditolak LeadKu, dan token tanpa URL tidak ada tujuannya.
func (s *CRMService) IsConfigured() bool {
	return strings.TrimSpace(s.cfg.LeadKuLeadURL) != "" &&
		strings.TrimSpace(s.cfg.LeadKuIngestToken) != ""
}

type crmWebsiteLead struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	Phone       string `json:"phone,omitempty"`
	Subject     string `json:"subject,omitempty"`
	Message     string `json:"message,omitempty"`
	BudgetRange string `json:"budget_range,omitempty"`

	UTMSource   string `json:"utm_source,omitempty"`
	UTMMedium   string `json:"utm_medium,omitempty"`
	UTMCampaign string `json:"utm_campaign,omitempty"`
	UTMTerm     string `json:"utm_term,omitempty"`
	GCLID       string `json:"gclid,omitempty"`
	LandingPage string `json:"landing_page,omitempty"`
}

// PushContactLead mengirim lead ke LeadKu. Mengembalikan error agar pemanggil
// bisa mencatatnya; pemanggil TIDAK boleh menggagalkan respons formulir
// karenanya.
func (s *CRMService) PushContactLead(ctx context.Context, lead *model.ContactLead) error {
	if !s.IsConfigured() {
		return nil
	}

	deref := func(v *string) string {
		if v == nil {
			return ""
		}
		return strings.TrimSpace(*v)
	}

	payload := crmWebsiteLead{
		Name:        lead.Name,
		Email:       lead.Email,
		Phone:       deref(lead.Phone),
		// Label, bukan kunci mentah: nilai ini menjadi judul deal di CRM, dan
		// "Website (website)" tidak memberi tahu apa pun kepada tim sales.
		Subject:     model.SubjectLabel(lead.Subject),
		Message:     lead.Message,
		BudgetRange: deref(lead.BudgetRange),
		UTMSource:   deref(lead.UTMSource),
		UTMMedium:   deref(lead.UTMMedium),
		UTMCampaign: deref(lead.UTMCampaign),
		UTMTerm:     deref(lead.UTMTerm),
		GCLID:       deref(lead.GCLID),
		LandingPage: deref(lead.LandingPage),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal crm lead: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		strings.TrimSpace(s.cfg.LeadKuLeadURL), bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build crm request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Lead-Ingest-Token", strings.TrimSpace(s.cfg.LeadKuIngestToken))

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("call crm: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		// Badan balasan dipotong: cukup untuk mendiagnosis, tidak cukup untuk
		// membanjiri log bila LeadKu membalas halaman galat HTML.
		snippet, _ := io.ReadAll(io.LimitReader(resp.Body, 300))
		return fmt.Errorf("crm menolak lead: status %d: %s", resp.StatusCode, strings.TrimSpace(string(snippet)))
	}
	return nil
}
