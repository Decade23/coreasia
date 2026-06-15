package handler

import (
	"context"
	"errors"
	"testing"
)

// stubVerifier is a test double for mayarVerifier.
type stubVerifier struct {
	paid   bool
	err    error
	called bool
}

func (s *stubVerifier) VerifyTransactionPaid(_ context.Context, _ string) (bool, error) {
	s.called = true
	return s.paid, s.err
}

func TestCallbackVerifiedGating(t *testing.T) {
	cases := []struct {
		name        string
		mayarVerify bool
		verifier    *stubVerifier // nil → no client injected
		want        bool
		wantCalled  bool // whether the verifier should have been invoked
	}{
		{
			name:        "verify disabled: passes without calling verifier",
			mayarVerify: false,
			verifier:    &stubVerifier{paid: false}, // would say NO, but must be ignored
			want:        true,
			wantCalled:  false,
		},
		{
			name:        "verify enabled, transaction paid: passes",
			mayarVerify: true,
			verifier:    &stubVerifier{paid: true},
			want:        true,
			wantCalled:  true,
		},
		{
			name:        "verify enabled, transaction NOT paid: rejected",
			mayarVerify: true,
			verifier:    &stubVerifier{paid: false},
			want:        false,
			wantCalled:  true,
		},
		{
			name:        "verify enabled, API error: rejected (fail closed)",
			mayarVerify: true,
			verifier:    &stubVerifier{err: errors.New("boom")},
			want:        false,
			wantCalled:  true,
		},
		{
			name:        "verify enabled, no client: rejected (fail closed)",
			mayarVerify: true,
			verifier:    nil,
			want:        false,
			wantCalled:  false,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			h := &CADHandler{mayarVerify: tc.mayarVerify}
			if tc.verifier != nil {
				h.mayar = tc.verifier
			}
			got := h.callbackVerified(context.Background(), "txn_abc123", "buyer@example.com")
			if got != tc.want {
				t.Fatalf("callbackVerified = %v, want %v", got, tc.want)
			}
			if tc.verifier != nil && tc.verifier.called != tc.wantCalled {
				t.Fatalf("verifier called = %v, want %v", tc.verifier.called, tc.wantCalled)
			}
		})
	}
}

func TestParseMayarWebhook(t *testing.T) {
	body := []byte(`{
		"event": "payment.received",
		"data": {
			"id": "txn_abc123",
			"status": "SUCCESS",
			"customerEmail": "buyer@example.com",
			"customerName": "Budi",
			"amount": 99000,
			"productName": "CoreAsia Download Manager"
		}
	}`)

	p, err := parseMayarWebhook(body)
	if err != nil {
		t.Fatalf("parseMayarWebhook returned error: %v", err)
	}
	if p.Event != "payment.received" {
		t.Fatalf("unexpected event: %q", p.Event)
	}
	if p.Data.ID != "txn_abc123" {
		t.Fatalf("unexpected order id: %q", p.Data.ID)
	}
	if p.Data.CustomerEmail != "buyer@example.com" {
		t.Fatalf("unexpected email: %q", p.Data.CustomerEmail)
	}
	if p.Data.Amount != 99000 {
		t.Fatalf("unexpected amount: %d", p.Data.Amount)
	}
}

func TestParseMayarWebhookInvalidJSON(t *testing.T) {
	if _, err := parseMayarWebhook([]byte(`{not json`)); err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}
}

func TestMayarIsPaid(t *testing.T) {
	cases := []struct {
		name   string
		event  string
		status string // raw JSON value for data.status
		want   bool
	}{
		{"success uppercase string", "payment.received", `"SUCCESS"`, true},
		{"paid string", "payment.received", `"paid"`, true},
		{"settlement string", "payment.received", `"settlement"`, true},
		{"boolean true", "payment.received", `true`, true},
		{"empty status defaults paid", "payment.received", ``, true},
		{"pending string not paid", "payment.received", `"pending"`, false},
		{"failed string not paid", "payment.received", `"FAILED"`, false},
		{"boolean false not paid", "payment.received", `false`, false},
		{"wrong event", "payment.reminder", `"SUCCESS"`, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			p := &MayarWebhookPayload{Event: tc.event}
			if tc.status != "" {
				p.Data.Status = []byte(tc.status)
			}
			if got := mayarIsPaid(p); got != tc.want {
				t.Fatalf("mayarIsPaid(event=%q,status=%q) = %v, want %v", tc.event, tc.status, got, tc.want)
			}
		})
	}
}
