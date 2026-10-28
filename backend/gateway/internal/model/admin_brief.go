package model

import "time"

// Admin DTOs deliberately omit request fingerprints and advertising identifiers.
type BriefDeliveryStatus struct {
	Channel     string     `json:"channel"`
	Status      string     `json:"status"`
	Attempts    int        `json:"attempts"`
	DeliveredAt *time.Time `json:"delivered_at"`
}

type AdminBrief struct {
	ID               string                `json:"id"`
	Reference        string                `json:"reference"`
	Name             string                `json:"name"`
	Email            string                `json:"email"`
	Phone            string                `json:"phone"`
	Subject          string                `json:"subject"`
	PreferredContact string                `json:"preferred_contact"`
	Organization     string                `json:"organization"`
	CreatedAt        time.Time             `json:"created_at"`
	Deliveries       []BriefDeliveryStatus `json:"deliveries"`
	Message          string                `json:"message,omitempty"`
	BudgetRange      string                `json:"budget_range,omitempty"`
	Timeline         string                `json:"timeline,omitempty"`
	SelectedPlan     string                `json:"selected_plan,omitempty"`
	ConsentedAt      *time.Time            `json:"consented_at,omitempty"`
}
