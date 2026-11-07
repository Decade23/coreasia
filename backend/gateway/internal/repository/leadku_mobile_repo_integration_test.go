package repository

import (
	"context"
	"errors"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func leadkuIsolatedDatabase(t *testing.T) (*pgxpool.Pool, context.Context) {
	t.Helper()
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
	t.Cleanup(pool.Close)
	if _, err = pool.Exec(ctx, "DROP TABLE IF EXISTS public.leadku_setup_requests,public.leadku_signup_handoffs,public.leadku_play_sync,public.leadku_play_daily,public.leadku_mobile_policy,public.leadku_mobile_events,public.leadku_mobile_installations CASCADE"); err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{"../../migrations/000020_leadku_mobile.up.sql", "../../migrations/000021_leadku_mobile_funnel.up.sql"} {
		raw, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, string(raw)); err != nil {
			t.Fatal(err)
		}
	}
	return pool, ctx
}

func TestLeadkuMobileIsolatedDatabase(t *testing.T) {
	pool, ctx := leadkuIsolatedDatabase(t)
	var err error
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

func TestLeadkuFunnelCohortAndRequestIsolation(t *testing.T) {
	pool, ctx := leadkuIsolatedDatabase(t)
	repo := NewLeadkuMobileRepo(pool)
	install := func(channel, pkg string, kinds ...string) model.LeadkuMobilePulse {
		t.Helper()
		p := model.LeadkuMobilePulse{InstallationID: uuid.NewString(), Package: pkg, AppVersion: "1.6.4", VersionCode: 17, OSVersion: "17"}
		for _, kind := range kinds {
			p.Events = append(p.Events, model.LeadkuMobileEvent{ID: uuid.NewString(), Kind: kind})
		}
		if err := repo.Pulse(ctx, channel, p); err != nil {
			t.Fatal(err)
		}
		return p
	}
	demo := install("uat", "id.coreasia.leadku.qa.prod", "first_open", "first_open", "welcome_view", "demo_started", "demo_key_action", "guide_opened", "guide_completed")
	direct := install("uat", "id.coreasia.leadku.qa.prod", "first_open", "demo_key_action", "guide_completed")
	legacy := install("uat", "id.coreasia.leadku.qa.prod", "session_start", "demo_started")
	old := install("uat", "id.coreasia.leadku.qa.prod", "first_open", "welcome_view")
	if _, err := pool.Exec(ctx, "UPDATE public.leadku_mobile_events SET recorded_at = now() - interval '31 days' WHERE installation_id = $1 AND kind = 'first_open'", old.InstallationID); err != nil {
		t.Fatal(err)
	}
	prod := install("production", "id.coreasia.leadku", "first_open")
	request := model.LeadkuSetupRequest{Channel: "email", Contact: "dummy@example.invalid", Topic: "pipeline"}
	for _, p := range []model.LeadkuMobilePulse{demo, demo} {
		if err := repo.CreateSetupRequest(ctx, "uat", p, request); err != nil {
			t.Fatal(err)
		}
	}
	if err := repo.CreateSetupRequest(ctx, "production", demo, request); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("request accepted in wrong channel: %v", err)
	}
	rows, err := repo.SetupRequests(ctx, "uat")
	if err != nil || len(rows) != 1 || rows[0].Contact != request.Contact || rows[0].Channel != request.Channel {
		t.Fatalf("bad dedup/response: %+v %v", rows, err)
	}
	rows, err = repo.SetupRequests(ctx, "production")
	if err != nil || len(rows) != 0 {
		t.Fatalf("UAT contact leaked into production: %+v %v", rows, err)
	}
	if _, err := repo.SignupHandoff(ctx, "production", demo, true); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("handoff accepted in wrong channel: %v", err)
	}
	ref, err := repo.SignupHandoff(ctx, "uat", demo, true)
	if err != nil || ref == demo.InstallationID || uuid.Validate(ref) != nil {
		t.Fatalf("handoff didn't issue an opaque ref: %v", err)
	}
	refReplay, err := repo.SignupHandoff(ctx, "uat", demo, true)
	if err != nil || ref != refReplay {
		t.Fatalf("handoff retry did not retain its reference: %v", err)
	}
	if done, err := repo.CompleteSignup(ctx, uuid.NewString()); err != nil || done {
		t.Fatalf("unknown ref accepted: %v", err)
	}
	if done, err := repo.CompleteSignup(ctx, ref); err != nil || !done {
		t.Fatalf("valid ref rejected: %v", err)
	}
	if _, err := pool.Exec(ctx, "UPDATE public.leadku_signup_handoffs SET expires_at = now() - interval '1 second' WHERE ref = $1", ref); err != nil {
		t.Fatal(err)
	}
	if done, err := repo.CompleteSignup(ctx, ref); err != nil || !done {
		t.Fatalf("completed ref replay rejected: %v", err)
	}
	expired, err := repo.SignupHandoff(ctx, "uat", direct, false)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "UPDATE public.leadku_signup_handoffs SET expires_at = now() - interval '1 second' WHERE ref = $1", expired); err != nil {
		t.Fatal(err)
	}
	if done, err := repo.CompleteSignup(ctx, expired); err != nil || done {
		t.Fatalf("expired uncompleted ref accepted: %v", err)
	}
	newRef, err := repo.SignupHandoff(ctx, "uat", direct, false)
	if err != nil || expired == newRef {
		t.Fatalf("retry should rotate expired uncompleted ref: %v", err)
	}
	if _, err := repo.SignupHandoff(ctx, "uat", legacy, false); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.SignupHandoff(ctx, "production", prod, false); err != nil {
		t.Fatal(err)
	}
	want := model.LeadkuMobileFunnel{FirstOpen: 2, WelcomeView: 1, DemoStarted: 1, DemoKeyAction: 1, GuideOpened: 1, GuideCompleted: 1, SignupStarted: 2, SignupDirect: 1, SignupViaDemo: 1, SignupCompleted: 1, SetupHelpRequested: 1}
	got, err := repo.Funnel(ctx, "uat")
	if err != nil || got != want {
		t.Fatalf("unexpected UAT funnel %+v, want %+v: %v", got, want, err)
	}
	got, err = repo.Funnel(ctx, "production")
	if err != nil || got != (model.LeadkuMobileFunnel{FirstOpen: 1, SignupStarted: 1, SignupDirect: 1}) {
		t.Fatalf("unexpected production funnel %+v: %v", got, err)
	}
}
