package service

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
)

func leadContoh() *model.ContactLead {
	ptr := func(s string) *string { return &s }
	return &model.ContactLead{
		ID:          uuid.New(),
		Name:        "Budi Santoso",
		Email:       "budi@contoh.co.id",
		Phone:       ptr("+628123456789"),
		Subject:     "website",
		Message:     "Butuh company profile.",
		BudgetRange: ptr("10_25jt"),
		UTMSource:   ptr("google"),
		UTMMedium:   ptr("cpc"),
		GCLID:       ptr("ABC123"),
	}
}

// Tanpa konfigurasi, penerusan harus diam sepenuhnya. Ini penting: instalasi
// yang belum menyiapkan LeadKu tidak boleh melihat galat di log setiap kali ada
// lead masuk, karena galat palsu membuat galat sungguhan ikut diabaikan.
func TestPushContactLead_TanpaKonfigurasiTidakMelakukanApaPun(t *testing.T) {
	dipanggil := false
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		dipanggil = true
	}))
	defer srv.Close()

	for _, cfg := range []config.CRMConfig{
		{},
		{LeadKuLeadURL: srv.URL},       // token kosong
		{LeadKuIngestToken: "rahasia"}, // URL kosong
		{LeadKuLeadURL: "  ", LeadKuIngestToken: "  "}, // hanya spasi
	} {
		s := NewCRMService(cfg)
		if s.IsConfigured() {
			t.Fatalf("IsConfigured() harus false untuk %+v", cfg)
		}
		if err := s.PushContactLead(context.Background(), leadContoh()); err != nil {
			t.Fatalf("PushContactLead() tanpa konfigurasi harus nil, dapat: %v", err)
		}
	}
	if dipanggil {
		t.Fatal("server tidak boleh dihubungi saat konfigurasi kosong")
	}
}

func TestPushContactLead_MengirimTokenDanPayload(t *testing.T) {
	var gotToken, gotContentType string
	var gotBody map[string]any

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotToken = r.Header.Get("X-Lead-Ingest-Token")
		gotContentType = r.Header.Get("Content-Type")
		raw, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(raw, &gotBody)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	s := NewCRMService(config.CRMConfig{LeadKuLeadURL: srv.URL, LeadKuIngestToken: "rahasia-uji"})
	if err := s.PushContactLead(context.Background(), leadContoh()); err != nil {
		t.Fatalf("PushContactLead() galat: %v", err)
	}

	if gotToken != "rahasia-uji" {
		t.Errorf("header token = %q, mau %q", gotToken, "rahasia-uji")
	}
	if gotContentType != "application/json" {
		t.Errorf("Content-Type = %q, mau application/json", gotContentType)
	}

	// Atribusi iklan WAJIB ikut. Tanpa gclid dan campaign, lead di CRM tidak
	// bisa dihubungkan kembali ke belanja iklan yang menghasilkannya.
	for kunci, mau := range map[string]string{
		"name":         "Budi Santoso",
		"email":        "budi@contoh.co.id",
		"budget_range": "10_25jt",
		"utm_source":   "google",
		"utm_medium":   "cpc",
		"gclid":        "ABC123",
	} {
		if got, _ := gotBody[kunci].(string); got != mau {
			t.Errorf("payload[%q] = %q, mau %q", kunci, got, mau)
		}
	}

	// Field kosong harus hilang dari payload, bukan terkirim sebagai string
	// kosong, supaya LeadKu bisa membedakan tidak diisi dari diisi kosong.
	if _, ada := gotBody["utm_campaign"]; ada {
		t.Error("utm_campaign kosong seharusnya tidak ikut terkirim")
	}
}

func TestPushContactLead_StatusGagalMenjadiError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"token tidak valid"}`))
	}))
	defer srv.Close()

	s := NewCRMService(config.CRMConfig{LeadKuLeadURL: srv.URL, LeadKuIngestToken: "salah"})
	err := s.PushContactLead(context.Background(), leadContoh())
	if err == nil {
		t.Fatal("status 401 harus menghasilkan error")
	}
	// Pesannya harus memuat status dan potongan balasan, karena tanpa keduanya
	// penyebab penolakan tidak bisa didiagnosis dari log saja.
	if !strings.Contains(err.Error(), "401") || !strings.Contains(err.Error(), "token tidak valid") {
		t.Errorf("pesan error kurang informatif: %v", err)
	}
}
