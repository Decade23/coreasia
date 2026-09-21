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
	// ReportedClientIP: IP peramban yang DILAPORKAN BFF console (header
	// X-Konsol-Klien-IP, lihat internal/auditip) untuk aksi lewat proxy landing.
	// TIDAK diverifikasi; IPAddress tetap IP yang dilihat gateway sendiri.
	ReportedClientIP *string   `json:"reported_client_ip"`
	CreatedAt        time.Time `json:"created_at"`
}
