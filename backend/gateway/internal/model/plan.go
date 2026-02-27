package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type SubscriptionPlan struct {
	ID           uuid.UUID       `json:"id"`
	Name         string          `json:"name"`
	MaxAssessees int             `json:"max_assessees"`
	MaxSchemes   int             `json:"max_schemes"`
	Features     json.RawMessage `json:"features"`
	PriceMonthly float64         `json:"price_monthly"`
	IsActive     bool            `json:"is_active"`
	CreatedAt    time.Time       `json:"created_at"`
}

// PlanResponse is the public-facing DTO for subscription plans.
type PlanResponse struct {
	ID           uuid.UUID       `json:"id"`
	Name         string          `json:"name"`
	MaxAssessees int             `json:"max_assessees"`
	MaxSchemes   int             `json:"max_schemes"`
	Features     json.RawMessage `json:"features"`
	PriceMonthly float64         `json:"price_monthly"`
}
