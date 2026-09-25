package main

import (
	"bytes"
	"context"
	"errors"
	"log/slog"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/testenv"
	"github.com/golang-migrate/migrate/v4"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// tempDB: database kosong baru di server uji sekali pakai, dimigrasi penuh
// lewat golang-migrate (tabel migrasi sama dengan produksi), dihapus sesudah uji.
func tempDB(t *testing.T) (*pgxpool.Pool, context.Context) {
	t.Helper()
	base := testenv.DatabaseURL(t)
	testenv.DatabaseDisposable(t)
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	t.Cleanup(cancel)
	admin, err := pgxpool.New(ctx, base)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(admin.Close)
	if err := admin.Ping(ctx); err != nil {
		testenv.Unavailable(t, "postgres tidak terjangkau: %v", err)
	}
	name := "gw_uji_start_" + strings.ReplaceAll(uuid.NewString()[:8], "-", "")
	if _, err := admin.Exec(ctx, "CREATE DATABASE "+name); err != nil {
		t.Fatalf("CREATE DATABASE: %v", err)
	}
	t.Cleanup(func() {
		_, _ = admin.Exec(context.Background(), "DROP DATABASE IF EXISTS "+name+" WITH (FORCE)")
	})
	u, err := url.Parse(base)
	if err != nil {
		t.Fatal(err)
	}
	u.Path = "/" + name
	dsn := u.String()
	q := u.Query()
	q.Set("x-migrations-table", "gateway_schema_migrations")
	u.RawQuery = q.Encode()
	m, err := migrate.New("file://../../migrations", u.String())
	if err != nil {
		t.Fatal(err)
	}
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		t.Fatalf("migrasi: %v", err)
	}
	m.Close()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	return pool, ctx
}

// captureLog mengganti logger bawaan selama uji dan memulangkan isinya.
func captureLog(t *testing.T) *bytes.Buffer {
	t.Helper()
	var buf bytes.Buffer
	prev := slog.Default()
	slog.SetDefault(slog.New(slog.NewTextHandler(&buf, &slog.HandlerOptions{Level: slog.LevelInfo})))
	t.Cleanup(func() { slog.SetDefault(prev) })
	return &buf
}

// Pemeriksaan admin saat start: auto-seed menyimpan ADMIN_EMAIL dalam bentuk
// baku, dan email admin kembar (indeks 000016 tidak terpasang) dicatat ERROR di
// setiap start. Baris log itu adalah butir verifikasi rilis paket A di README.
func TestPrepareAdmins_SeedBakuDanPeringatanKembar(t *testing.T) {
	pool, ctx := tempDB(t)
	t.Setenv("ADMIN_EMAIL", "  Admin@CoreAsia.ID ")
	t.Setenv("ADMIN_PASSWORD", "SandiSeed-123")
	t.Setenv("ADMIN_NAME", "")
	cfg := &config.Config{}

	buf := captureLog(t)
	prepareAdmins(ctx, pool, cfg)
	var email string
	if err := pool.QueryRow(ctx, `SELECT email FROM public.admin_users`).Scan(&email); err != nil || email != "admin@coreasia.id" {
		t.Fatalf("seed: email %q, err %v, want bentuk baku admin@coreasia.id", email, err)
	}
	if strings.Contains(buf.String(), "email admin kembar") {
		t.Fatalf("tanpa kembaran tidak boleh ada peringatan: %s", buf.String())
	}

	// Data lama berkembar: indeks 000016 tidak ada, baris beda huruf.
	if _, err := pool.Exec(ctx, `DROP INDEX IF EXISTS public.admin_users_email_lower_key`); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO public.admin_users (email, password_hash, full_name) VALUES ('ADMIN@coreasia.id', 'x', 'Kembar')`); err != nil {
		t.Fatal(err)
	}
	buf.Reset()
	prepareAdmins(ctx, pool, cfg)
	out := buf.String()
	if !strings.Contains(out, "level=ERROR") || !strings.Contains(out, "email admin kembar tanpa peka huruf") || !strings.Contains(out, "jumlah_email_kembar=1") {
		t.Fatalf("start dengan email kembar harus mencatat ERROR: %q", out)
	}
	var n int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM public.admin_users`).Scan(&n); err != nil || n != 2 {
		t.Fatalf("admin sudah ada: tidak boleh seed lagi (%d baris, %v)", n, err)
	}
}
