package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type BotSchedule struct {
	ID         uuid.UUID        `json:"id"`
	Name       string           `json:"name"`
	BotType    string           `json:"bot_type"`
	Schedule   string           `json:"schedule"`
	Timezone   string           `json:"timezone"`
	IsActive   bool             `json:"is_active"`
	LastRunAt  *time.Time       `json:"last_run_at"`
	LastStatus string           `json:"last_status"`
	LastError  *string          `json:"last_error"`
	RunCount   int              `json:"run_count"`
	Config     json.RawMessage  `json:"config"`
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`
}

type CreateBotScheduleRequest struct {
	Name     string          `json:"name" validate:"required,min=2,max=100"`
	BotType  string          `json:"bot_type" validate:"required"`
	Schedule string          `json:"schedule" validate:"required"`
	Timezone string          `json:"timezone" validate:"required"`
	Config   json.RawMessage `json:"config"`
}

type UpdateBotScheduleRequest struct {
	Name     *string          `json:"name" validate:"omitempty,min=2,max=100"`
	Schedule *string          `json:"schedule"`
	Timezone *string          `json:"timezone"`
	IsActive *bool            `json:"is_active"`
	Config   *json.RawMessage `json:"config"`
}
