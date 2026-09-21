package repository

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auditip"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Uji SQL AuditLogRepo terhadap Postgres sungguhan yang sudah dimigrasi
// (000015: reported_client_ip). Opt-in lewat GATEWAY_TEST_DATABASE_URL. Semua
// tulisan terjadi di dalam satu transaksi yang selalu di-ROLLBACK.
func TestAuditLogRepo_IPDilaporkan(t *testing.T) {
	dsn := os.Getenv("GATEWAY_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("GATEWAY_TEST_DATABASE_URL tidak di-set")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = tx.Rollback(context.Background()) }()

	r := &AuditLogRepo{pool: tx}
	res := "uji-reported-ip-" + time.Now().Format("150405.000000")
	desc := "uji audit (rollback)"
	nama := "Uji"

	// Dengan IP yang dilaporkan BFF dan tanpa.
	r.LogAction(auditip.With(ctx, "203.0.113.61"), nil, &nama, "update", res, nil, &desc, "10.0.0.9")
	r.LogAction(ctx, nil, &nama, "update", res, nil, &desc, "198.51.100.7")

	logs, total, err := r.FindAll(ctx, 1, 10, res)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	if total != 2 || len(logs) != 2 {
		t.Fatalf("total=%d len=%d, want 2", total, len(logs))
	}
	var dengan, tanpa int
	for _, l := range logs {
		switch {
		case l.ReportedClientIP != nil && *l.ReportedClientIP == "203.0.113.61" && *l.IPAddress == "10.0.0.9":
			dengan++
		case l.ReportedClientIP == nil && *l.IPAddress == "198.51.100.7":
			tanpa++
		default:
			t.Fatalf("baris tak terduga: ip=%v reported=%v", deref(l.IPAddress), deref(l.ReportedClientIP))
		}
	}
	if dengan != 1 || tanpa != 1 {
		t.Fatalf("dengan=%d tanpa=%d", dengan, tanpa)
	}
}

func deref(s *string) string {
	if s == nil {
		return "<nil>"
	}
	return *s
}
