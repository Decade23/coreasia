package service

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/coreasia/gateway/internal/config"
)

func TestMayarStatusIsPaid(t *testing.T) {
	cases := []struct {
		raw  string
		want bool
	}{
		{`"settled"`, true},
		{`"SETTLED"`, true},
		{`"success"`, true},
		{`"paid"`, true},
		{`true`, true},
		{`"pending"`, false},
		{`"active"`, false},
		{`"FAILED"`, false},
		{`false`, false},
		{``, false},
	}
	for _, tc := range cases {
		if got := mayarStatusIsPaid(json.RawMessage(tc.raw)); got != tc.want {
			t.Errorf("mayarStatusIsPaid(%q) = %v, want %v", tc.raw, got, tc.want)
		}
	}
}

func TestVerifyTransactionPaid(t *testing.T) {
	const wantID = "ff5e591d-6740-442b-8aec-26e72b60c29e"

	// Fake Mayar: page 1 has an unrelated settled txn (hasMore=true),
	// page 2 has the target txn settled.
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer test-key" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Query().Get("page") {
		case "1":
			_, _ = w.Write([]byte(`{"statusCode":200,"messages":"success","hasMore":true,"data":[{"id":"other","status":"settled"}]}`))
		default:
			_, _ = w.Write([]byte(`{"statusCode":200,"messages":"success","hasMore":false,"data":[{"id":"` + wantID + `","status":"settled"}]}`))
		}
	}))
	defer srv.Close()

	m := NewMayarClient(config.PaymentsConfig{MayarAPIKey: "test-key", MayarAPIBase: srv.URL})

	t.Run("found and paid", func(t *testing.T) {
		paid, err := m.VerifyTransactionPaid(context.Background(), wantID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !paid {
			t.Fatal("expected paid=true")
		}
	})

	t.Run("not found -> not paid, no error", func(t *testing.T) {
		paid, err := m.VerifyTransactionPaid(context.Background(), "nonexistent")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if paid {
			t.Fatal("expected paid=false for unknown id")
		}
	})

	t.Run("empty id errors", func(t *testing.T) {
		if _, err := m.VerifyTransactionPaid(context.Background(), ""); err == nil {
			t.Fatal("expected error for empty id")
		}
	})

	t.Run("no api key errors", func(t *testing.T) {
		m2 := NewMayarClient(config.PaymentsConfig{})
		if _, err := m2.VerifyTransactionPaid(context.Background(), wantID); err == nil {
			t.Fatal("expected error when api key missing")
		}
	})
}

func TestVerifyTransactionPaidNon200(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, `{"messages":"server error"}`, http.StatusInternalServerError)
	}))
	defer srv.Close()

	m := NewMayarClient(config.PaymentsConfig{MayarAPIKey: "test-key", MayarAPIBase: srv.URL})
	if _, err := m.VerifyTransactionPaid(context.Background(), "x"); err == nil {
		t.Fatal("expected error on non-200 response")
	}
}
