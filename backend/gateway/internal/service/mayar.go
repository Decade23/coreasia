package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/config"
)

// MayarClient performs OUTBOUND callback-verification against Mayar's REST API.
//
// Rationale: the inbound purchase webhook is only authenticated by a shared
// secret (MAYAR_WEBHOOK_TOKEN). A leaked/guessed token would let an attacker
// mint free license keys with a spoofed "paid" payload. This client provides an
// independent confirmation by asking Mayar itself whether the transaction is
// genuinely PAID before a key is assigned.
//
// Mayar exposes NO get-transaction-by-id endpoint, only a paginated list of
// paid transactions: GET {base}/transactions?page=N&pageSize=M (auth: Bearer
// MAYAR_API_KEY). We therefore page through the paid list and match by id.
// Docs: https://docs.mayar.id/api-reference/transaction/paidtransaction
type MayarClient struct {
	apiKey  string
	apiBase string
	client  *http.Client
}

func NewMayarClient(cfg config.PaymentsConfig) *MayarClient {
	base := strings.TrimRight(strings.TrimSpace(cfg.MayarAPIBase), "/")
	if base == "" {
		base = "https://api.mayar.id/hl/v1"
	}
	return &MayarClient{
		apiKey:  strings.TrimSpace(cfg.MayarAPIKey),
		apiBase: base,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// IsConfigured reports whether an API key is present (callback-verify possible).
func (m *MayarClient) IsConfigured() bool {
	return m.apiKey != ""
}

// mayarTxn mirrors one object in the paid-transactions "data" array.
// Mayar's webhook sends data.id as the transaction id; the list endpoint exposes
// both "id" and "paymentLinkTransactionId" — we match either to be robust.
type mayarTxn struct {
	ID                       string          `json:"id"`
	PaymentLinkTransactionID string          `json:"paymentLinkTransactionId"`
	Status                   json.RawMessage `json:"status"`
}

// mayarTxnListResponse mirrors the paginated paid-transactions response.
type mayarTxnListResponse struct {
	StatusCode int        `json:"statusCode"`
	Messages   string     `json:"messages"`
	HasMore    bool       `json:"hasMore"`
	Page       int        `json:"page"`
	PageCount  int        `json:"pageCount"`
	Data       []mayarTxn `json:"data"`
}

// mayarStatusIsPaid normalizes a Mayar status (string OR boolean) to a paid bool.
// Mayar's paid-transactions list reports "settled"; we also accept the values
// the webhook/other endpoints may use ("success"/"paid"/true).
func mayarStatusIsPaid(raw json.RawMessage) bool {
	s := strings.Trim(strings.TrimSpace(string(raw)), `"`)
	s = strings.ToLower(strings.TrimSpace(s))
	switch s {
	case "settled", "success", "paid", "settlement", "true":
		return true
	default:
		return false
	}
}

// maxVerifyPages caps pagination so a bad/huge account can't hang the webhook.
const maxVerifyPages = 20

// verifyPageSize is the page size used when scanning the paid-transactions list.
const verifyPageSize = 50

// VerifyTransactionPaid asks Mayar whether transactionID is genuinely PAID.
//
// Because Mayar has no get-by-id endpoint, it pages through the paid-transactions
// list (which only contains PAID/settled rows) and returns true as soon as a row
// matches transactionID by either "id" or "paymentLinkTransactionId". Returns
// (false, nil) if the id is not found among paid transactions; returns an error
// on transport / non-2xx / JSON-parse failures so the caller can fail closed.
func (m *MayarClient) VerifyTransactionPaid(ctx context.Context, transactionID string) (bool, error) {
	transactionID = strings.TrimSpace(transactionID)
	if transactionID == "" {
		return false, fmt.Errorf("transaction id kosong")
	}
	if m.apiKey == "" {
		return false, fmt.Errorf("MAYAR_API_KEY belum dikonfigurasi")
	}

	for page := 1; page <= maxVerifyPages; page++ {
		resp, err := m.fetchPaidPage(ctx, page)
		if err != nil {
			return false, err
		}
		for i := range resp.Data {
			t := &resp.Data[i]
			if t.ID == transactionID || (t.PaymentLinkTransactionID != "" && t.PaymentLinkTransactionID == transactionID) {
				if mayarStatusIsPaid(t.Status) {
					return true, nil
				}
				// Found the transaction but it is not in a paid state.
				slog.Warn("verifikasi Mayar: transaksi ditemukan tapi belum lunas",
					"transaction_id", transactionID, "status", strings.Trim(string(t.Status), `"`))
				return false, nil
			}
		}
		if !resp.HasMore || len(resp.Data) == 0 {
			break
		}
	}

	// Not found among paid transactions → treat as not paid (do NOT error).
	slog.Warn("verifikasi Mayar: transaksi tidak ditemukan di daftar paid", "transaction_id", transactionID)
	return false, nil
}

// fetchPaidPage GETs one page of the paid-transactions list.
func (m *MayarClient) fetchPaidPage(ctx context.Context, page int) (*mayarTxnListResponse, error) {
	q := url.Values{}
	q.Set("page", fmt.Sprintf("%d", page))
	q.Set("pageSize", fmt.Sprintf("%d", verifyPageSize))
	endpoint := m.apiBase + "/transactions?" + q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("buat request Mayar: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Accept", "application/json")

	resp, err := m.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request Mayar gagal: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 5<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("Mayar API error (%d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var out mayarTxnListResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("parse respons Mayar: %w", err)
	}
	return &out, nil
}
