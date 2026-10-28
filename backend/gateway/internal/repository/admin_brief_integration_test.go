package repository

import (
	"context"
	"encoding/json"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/testenv"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"strings"
	"testing"
)

func TestAdminBriefReadOnlyListing(t *testing.T) {
	testenv.DatabaseDisposable(t)
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, testenv.DatabaseURL(t))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	r := NewContactLeadRepo(pool)
	marker := "Search%_" + uuid.NewString()
	l := &model.ContactLead{Name: marker, Email: "qa@example.test", Phone: nil, PreferredContact: "email", Subject: "website", Message: "<script>user supplied body</script>", Consent: true, Status: "new", RequestID: uuid.NewString(), PayloadHash: "private-fingerprint", Timeline: "soon", Organization: "Contoh", SelectedPlan: "Website"}
	if err = r.Create(ctx, l); err != nil {
		t.Fatal(err)
	}
	defer func() {
		pool.Exec(ctx, `DELETE FROM contact_lead_deliveries WHERE lead_id=$1`, l.ID)
		pool.Exec(ctx, `DELETE FROM contact_leads WHERE id=$1`, l.ID)
	}()
	if _, err = pool.Exec(ctx, `UPDATE contact_lead_deliveries SET status='sent',attempts=1,delivered_at=NOW() WHERE lead_id=$1 AND channel='email'`, l.ID); err != nil {
		t.Fatal(err)
	}
	list, total, err := r.ListBriefs(ctx, 1, 25, marker)
	if err != nil || total != 1 || len(list) != 1 {
		t.Fatalf("listing total=%d count=%d err=%v", total, len(list), err)
	}
	if list[0].Message != "" || list[0].Reference != l.Reference || list[0].Email != "qa@example.test" {
		t.Fatal("summary lost data or included body")
	}
	if len(list[0].Deliveries) != 2 {
		t.Fatal("delivery statuses lost")
	}
	second, _, err := r.ListBriefs(ctx, 2, 1, marker)
	if err != nil || len(second) != 0 {
		t.Fatal("pagination failed", err)
	}
	detail, err := r.GetBrief(ctx, l.ID.String())
	if err != nil || detail == nil || detail.Message != l.Message || detail.SelectedPlan != "Website" {
		t.Fatal("detail failed", err)
	}
	encoded, _ := json.Marshal(detail)
	if strings.Contains(string(encoded), "private-fingerprint") || strings.Contains(string(encoded), l.RequestID) {
		t.Fatal("private persistence data leaked")
	}
	// Legacy pre-brief rows may have null/empty contact fields and no reference.
	if _, err = pool.Exec(ctx, `UPDATE contact_leads SET reference=NULL,phone='',preferred_contact='' WHERE id=$1`, l.ID); err != nil {
		t.Fatal(err)
	}
	detail, err = r.GetBrief(ctx, l.ID.String())
	if err != nil || detail.PreferredContact != "email" {
		t.Fatal("legacy email-only contact inferred incorrectly", err)
	}
	if _, err = pool.Exec(ctx, `UPDATE contact_leads SET reference=NULL,email=NULL,phone=NULL WHERE id=$1`, l.ID); err != nil {
		t.Fatal(err)
	}
	detail, err = r.GetBrief(ctx, l.ID.String())
	if err != nil || detail.Reference != l.Reference || detail.Email != "" || detail.Phone != "" {
		t.Fatal("legacy nullable fields failed", err)
	}
	var count int
	if err = pool.QueryRow(ctx, `SELECT count(*) FROM contact_lead_deliveries WHERE lead_id=$1`, l.ID).Scan(&count); err != nil || count != 2 {
		t.Fatal("reading altered delivery jobs", err)
	}
	missing, err := r.GetBrief(ctx, uuid.NewString())
	if err != nil || missing != nil {
		t.Fatal("not-found contract failed", err)
	}
}
