package service

import (
	"bytes"
	"context"
	"crypto/sha512"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/config"
	"github.com/google/uuid"
)

type MidtransService struct {
	cfg    config.MidtransConfig
	client *http.Client
}

type CreatePaymentInput struct {
	RegistrationID uuid.UUID
	OrgName        string
	PlanName       string
	AdminName      string
	AdminEmail     string
	AdminPhone     *string
	Amount         float64
}

type CreatePaymentResult struct {
	Reference   string
	Token       string
	CheckoutURL string
}

type MidtransNotification struct {
	OrderID           string `json:"order_id"`
	StatusCode        string `json:"status_code"`
	GrossAmount       string `json:"gross_amount"`
	SignatureKey      string `json:"signature_key"`
	TransactionStatus string `json:"transaction_status"`
	PaymentType       string `json:"payment_type"`
	FraudStatus       string `json:"fraud_status"`
	TransactionID     string `json:"transaction_id"`
	StatusMessage     string `json:"status_message"`
	TransactionTime   string `json:"transaction_time"`
}

type MidtransTransactionStatus struct {
	OrderID           string `json:"order_id"`
	StatusCode        string `json:"status_code"`
	GrossAmount       string `json:"gross_amount"`
	SignatureKey      string `json:"signature_key"`
	TransactionStatus string `json:"transaction_status"`
	PaymentType       string `json:"payment_type"`
	FraudStatus       string `json:"fraud_status"`
	TransactionID     string `json:"transaction_id"`
	StatusMessage     string `json:"status_message"`
	TransactionTime   string `json:"transaction_time"`
}

type midtransErrorResponse struct {
	StatusCode    string `json:"status_code"`
	StatusMessage string `json:"status_message"`
}

type midtransSnapTransactionRequest struct {
	TransactionDetails midtransTransactionDetails `json:"transaction_details"`
	ItemDetails        []midtransItemDetail       `json:"item_details,omitempty"`
	CustomerDetails    midtransCustomerDetails    `json:"customer_details"`
	Callbacks          *midtransCallbacks         `json:"callbacks,omitempty"`
	CustomField1       string                     `json:"custom_field_1,omitempty"`
}

type midtransTransactionDetails struct {
	OrderID     string `json:"order_id"`
	GrossAmount int64  `json:"gross_amount"`
}

type midtransItemDetail struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Price    int64  `json:"price"`
	Quantity int    `json:"quantity"`
}

type midtransCustomerDetails struct {
	FirstName string `json:"first_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone,omitempty"`
}

type midtransCallbacks struct {
	Finish   string `json:"finish,omitempty"`
	Unfinish string `json:"unfinish,omitempty"`
	Error    string `json:"error,omitempty"`
}

type midtransSnapTransactionResponse struct {
	Token       string `json:"token"`
	RedirectURL string `json:"redirect_url"`
}

func NewMidtransService(cfg config.MidtransConfig) *MidtransService {
	return &MidtransService{
		cfg: cfg,
		client: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

func (s *MidtransService) IsConfigured() bool {
	return strings.TrimSpace(s.cfg.ServerKey) != ""
}

func (s *MidtransService) CreateSnapTransaction(ctx context.Context, input CreatePaymentInput) (*CreatePaymentResult, error) {
	if !s.IsConfigured() {
		return nil, fmt.Errorf("midtrans server key belum dikonfigurasi")
	}

	grossAmount := int64(math.Round(input.Amount))
	if grossAmount <= 0 {
		return nil, fmt.Errorf("gross amount tidak valid: %.2f", input.Amount)
	}

	orderID := "reg-" + input.RegistrationID.String()
	reqBody := midtransSnapTransactionRequest{
		TransactionDetails: midtransTransactionDetails{
			OrderID:     orderID,
			GrossAmount: grossAmount,
		},
		ItemDetails: []midtransItemDetail{
			{
				ID:       "subscription-plan",
				Name:     fmt.Sprintf("%s - %s", s.cfg.MerchantName, input.PlanName),
				Price:    grossAmount,
				Quantity: 1,
			},
		},
		CustomerDetails: midtransCustomerDetails{
			FirstName: input.AdminName,
			Email:     input.AdminEmail,
		},
		CustomField1: input.RegistrationID.String(),
	}

	if input.AdminPhone != nil {
		reqBody.CustomerDetails.Phone = *input.AdminPhone
	}

	if callbacks := s.buildCallbacks(input.RegistrationID); callbacks != nil {
		reqBody.Callbacks = callbacks
	}

	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal midtrans transaction request: %w", err)
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		s.cfg.SnapBaseURL()+"/transactions",
		bytes.NewReader(payload),
	)
	if err != nil {
		return nil, fmt.Errorf("create midtrans request: %w", err)
	}

	s.applyAuth(req)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	if notificationURL := strings.TrimSpace(s.cfg.NotificationURL); notificationURL != "" {
		req.Header.Set("X-Override-Notification", notificationURL)
	}

	var result midtransSnapTransactionResponse
	if err := s.doJSON(req, &result); err != nil {
		return nil, err
	}

	return &CreatePaymentResult{
		Reference:   orderID,
		Token:       result.Token,
		CheckoutURL: result.RedirectURL,
	}, nil
}

func (s *MidtransService) GetTransactionStatus(ctx context.Context, reference string) (*MidtransTransactionStatus, error) {
	if !s.IsConfigured() {
		return nil, fmt.Errorf("midtrans server key belum dikonfigurasi")
	}

	statusURL := fmt.Sprintf("%s/%s/status", s.cfg.CoreBaseURL(), url.PathEscape(reference))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, statusURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create midtrans status request: %w", err)
	}

	s.applyAuth(req)
	req.Header.Set("Accept", "application/json")

	var result MidtransTransactionStatus
	if err := s.doJSON(req, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *MidtransService) VerifySignature(payload MidtransNotification) bool {
	if !s.IsConfigured() {
		return false
	}

	expected := s.signatureFor(payload.OrderID, payload.StatusCode, payload.GrossAmount)
	return strings.EqualFold(expected, payload.SignatureKey)
}

func (s *MidtransService) MapPaymentStatus(status *MidtransTransactionStatus) (paymentStatus string, shouldProvision bool) {
	switch strings.ToLower(status.TransactionStatus) {
	case "capture":
		if strings.EqualFold(status.FraudStatus, "challenge") {
			return "review", false
		}
		return "paid", true
	case "settlement":
		return "paid", true
	case "pending":
		return "pending", false
	case "deny", "cancel", "expire", "failure":
		return "failed", false
	case "refund", "partial_refund", "chargeback", "partial_chargeback":
		return "refunded", false
	default:
		return "pending", false
	}
}

func (s *MidtransService) applyAuth(req *http.Request) {
	token := base64.StdEncoding.EncodeToString([]byte(strings.TrimSpace(s.cfg.ServerKey) + ":"))
	req.Header.Set("Authorization", "Basic "+token)
}

func (s *MidtransService) buildCallbacks(registrationID uuid.UUID) *midtransCallbacks {
	finishURL := s.appendQuery(s.cfg.FinishURL, registrationID)
	unfinishURL := s.appendQuery(s.cfg.UnfinishURL, registrationID)
	errorURL := s.appendQuery(s.cfg.ErrorURL, registrationID)

	if finishURL == "" && unfinishURL == "" && errorURL == "" {
		return nil
	}

	return &midtransCallbacks{
		Finish:   finishURL,
		Unfinish: unfinishURL,
		Error:    errorURL,
	}
}

func (s *MidtransService) appendQuery(rawURL string, registrationID uuid.UUID) string {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return ""
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}

	query := parsed.Query()
	query.Set("registration_id", registrationID.String())
	query.Set("payment_provider", "midtrans")
	parsed.RawQuery = query.Encode()

	return parsed.String()
}

func (s *MidtransService) signatureFor(orderID, statusCode, grossAmount string) string {
	sum := sha512.Sum512([]byte(orderID + statusCode + grossAmount + strings.TrimSpace(s.cfg.ServerKey)))
	return hex.EncodeToString(sum[:])
}

func (s *MidtransService) doJSON(req *http.Request, out interface{}) error {
	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("midtrans request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read midtrans response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var apiErr midtransErrorResponse
		if json.Unmarshal(body, &apiErr) == nil && apiErr.StatusMessage != "" {
			return fmt.Errorf("midtrans error (%s): %s", apiErr.StatusCode, apiErr.StatusMessage)
		}

		return fmt.Errorf("midtrans error (%d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	if out == nil {
		return nil
	}

	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("decode midtrans response: %w", err)
	}

	return nil
}
