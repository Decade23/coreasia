package middleware

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/coreasia/gateway/internal/auditip"
	"github.com/gofiber/fiber/v3"
)

// IP yang dilaporkan BFF sampai ke context (untuk audit), dan tidak pernah
// memengaruhi ClientIP/ClientIPKey (pembatas & ip_address audit).
func TestReportedClientIP_HanyaUntukAudit(t *testing.T) {
	app := fiber.New()
	app.Use(ReportedClientIP)
	app.Get("/x", func(c fiber.Ctx) error {
		return c.SendString(auditip.From(c.Context()) + "|" + ClientIP(c) + "|" + ClientIPKey(c))
	})

	cases := []struct {
		name, header, wantReported string
	}{
		{"sah", "203.0.113.9", "203.0.113.9"},
		{"ipv4-mapped", "::ffff:203.0.113.9", "203.0.113.9"},
		{"sampah", "bukan ip", ""},
		{"daftar", "203.0.113.9, 198.51.100.1", ""},
		{"tanpa header", "", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/x", nil)
			if tc.header != "" {
				req.Header.Set(auditip.Header, tc.header)
			}
			res, err := app.Test(req)
			if err != nil {
				t.Fatal(err)
			}
			body, _ := io.ReadAll(res.Body)
			got := string(body)
			// app.Test tersambung dari 0.0.0.0: ClientIP selalu alamat TCP itu,
			// apa pun isi header yang dilaporkan.
			want := tc.wantReported + "|0.0.0.0|0.0.0.0"
			if got != want {
				t.Fatalf("got %q, want %q", got, want)
			}
		})
	}
}
