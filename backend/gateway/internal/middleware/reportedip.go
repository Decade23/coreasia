package middleware

import (
	"github.com/coreasia/gateway/internal/auditip"
	"github.com/gofiber/fiber/v3"
)

// ReportedClientIP menitipkan IP klien yang DILAPORKAN BFF console (header
// X-Konsol-Klien-IP) ke context permintaan, supaya pencatat audit bisa
// menyimpannya di gateway_audit_logs.reported_client_ip.
//
// Header ini TIDAK tepercaya (bisa dikarang pemanggil mana pun) dan sengaja
// tidak dibaca ClientIP/ClientIPKey: pembatas, kunci percobaan, ip_address
// audit, dan keputusan keamanan lain tidak pernah memakainya.
func ReportedClientIP(c fiber.Ctx) error {
	if v := c.Get(auditip.Header); v != "" {
		c.SetContext(auditip.With(c.Context(), v))
	}
	return c.Next()
}
