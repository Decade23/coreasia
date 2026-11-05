package repository

import (
	"context"
	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"
)

func TestLeadkuMobileIsolatedDatabase(t *testing.T) {
	dsn := os.Getenv("LEADKU_MOBILE_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("isolated database not configured")
	}
	parsed, err := url.Parse(dsn)
	if err != nil || parsed.Hostname() != "127.0.0.1" || strings.TrimPrefix(parsed.Path, "/") != "leadku_mobile_qa" {
		t.Fatal("only isolated loopback QA database is allowed")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	raw, err := os.ReadFile("../../migrations/000020_leadku_mobile.up.sql")
	if err != nil {
		t.Fatal(err)
	}
	_, _ = pool.Exec(ctx, "DROP TABLE IF EXISTS public.leadku_play_sync,public.leadku_play_daily,public.leadku_mobile_policy,public.leadku_mobile_events,public.leadku_mobile_installations CASCADE")
	if _, err = pool.Exec(ctx, string(raw)); err != nil {
		t.Fatal(err)
	}
	repo := NewLeadkuMobileRepo(pool)
	id := uuid.NewString()
	event := uuid.NewString()
	p := model.LeadkuMobilePulse{InstallationID: id, Package: "id.coreasia.leadku", AppVersion: "1.6.3", VersionCode: 13, OSVersion: "17", Events: []model.LeadkuMobileEvent{{ID: event, Kind: "session_start"}}}
	for i := 0; i < 2; i++ {
		if err = repo.Pulse(ctx, "production", p); err != nil {
			t.Fatal(err)
		}
	}
	s, err := repo.Summary(ctx, "production")
	if err != nil {
		t.Fatal(err)
	}
	if s.Counts.Installations != 1 || len(s.Usage) != 1 || s.Usage[0].Events != 1 {
		t.Fatalf("duplicate pulse counted: %+v", s)
	}
	if err = repo.Pulse(ctx, "uat", p); err == nil {
		t.Fatal("installation moved between channels")
	}
	p.InstallationID = uuid.NewString()
	p.Events[0].ID = uuid.NewString()
	if err = repo.Pulse(ctx, "uat", p); err != nil {
		t.Fatal(err)
	}
	uat, err := repo.Summary(ctx, "uat")
	if err != nil || uat.Counts.Installations != 1 {
		t.Fatalf("UAT isolation: %+v %v", uat, err)
	}
	s, err = repo.Summary(ctx, "production")
	if err != nil || s.Counts.Installations != 1 {
		t.Fatal("UAT leaked into production")
	}
	policy, err := repo.Policy(ctx, "production")
	if err != nil {
		t.Fatal(err)
	}
	old := policy.UpdatedAt.Format(time.RFC3339Nano)
	policy.LatestCode = 13
	policy.LatestVersion = "1.6.3"
	if _, err = repo.UpdatePolicy(ctx, policy, old); err != nil {
		t.Fatal(err)
	}
	if _, err = repo.UpdatePolicy(ctx, policy, old); err == nil {
		t.Fatal("stale editor overwrote policy")
	}
	days := []model.LeadkuPlayDay{{Day: "2026-11-04", Installs: 10, Uninstalls: 2, Source: "installs_id.coreasia.leadku_202611_country.csv"}}
	for i := 0; i < 2; i++ {
		if err = repo.ImportPlay(ctx, days); err != nil {
			t.Fatal(err)
		}
	}
	s, err = repo.Summary(ctx, "production")
	if err != nil || len(s.Play) != 1 || s.Play[0].Installs != 10 {
		t.Fatalf("Play import not idempotent: %+v %v", s, err)
	}
	if _, err = pool.Exec(ctx, "INSERT INTO public.leadku_mobile_events(id,installation_id,kind) VALUES($1,$2,'screen_view')", uuid.NewString(), uuid.NewString()); err == nil {
		t.Fatal("orphan event accepted")
	}
}
