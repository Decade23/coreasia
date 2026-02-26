package entity

import (
	"time"

	"github.com/google/uuid"
)

type Tenant struct {
	ID         uuid.UUID  `json:"id"`
	Name       string     `json:"name"`
	Slug       string     `json:"slug"`
	SchemaName string     `json:"schema_name"`
	Domain     *string    `json:"domain"`
	IsActive   bool       `json:"is_active"`
	PlanID     *uuid.UUID `json:"plan_id"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type SubscriptionPlan struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	MaxAssessees  int       `json:"max_assessees"`
	MaxSchemes    int       `json:"max_schemes"`
	Features      []byte    `json:"features"`
	PriceMonthly  float64   `json:"price_monthly"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
}
