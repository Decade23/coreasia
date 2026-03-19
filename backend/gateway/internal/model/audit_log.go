package model

import (
	"time"

	"github.com/google/uuid"
)

type GatewayAuditLog struct {
	ID          uuid.UUID  `json:"id"`
	UserID      *uuid.UUID `json:"user_id"`
	UserName    *string    `json:"user_name"`
	Action      string     `json:"action"`
	Resource    string     `json:"resource"`
	ResourceID  *string    `json:"resource_id"`
	Description *string    `json:"description"`
	IPAddress   *string    `json:"ip_address"`
	CreatedAt   time.Time  `json:"created_at"`
}
