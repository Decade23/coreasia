package repository

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/testenv"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestContactBriefPersistenceAndReplay(t *testing.T) {
	dsn := testenv.DatabaseURL(t)
	testenv.DatabaseDisposable(t)
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	repo := NewContactLeadRepo(pool)
	requestID := uuid.NewString()
	phone := "+6281200000000"
	create := func(hash string) *model.ContactLead {
		return &model.ContactLead{RequestID: requestID, PayloadHash: hash, Name: "Pengunjung Contoh", Phone: &phone, PreferredContact: "whatsapp", Subject: "webapp", Message: "Aplikasi pemesanan", Consent: true, Status: "new"}
	}
	var wg sync.WaitGroup
	results := make(chan *model.ContactLead, 8)
	errs := make(chan error, 8)
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			lead := create("same-payload")
			if err := repo.Create(ctx, lead); err != nil {
				errs <- err
			} else {
				results <- lead
			}
		}()
	}
	wg.Wait()
	close(results)
	close(errs)
	for err := range errs {
		t.Fatal(err)
	}
	var first *model.ContactLead
	fresh := 0
	for l := range results {
		if first == nil {
			first = l
		}
		if l.ID != first.ID || l.Reference != first.Reference {
			t.Fatal("retry returned a different lead")
		}
		if !l.Replayed {
			fresh++
		}
	}
	if first == nil {
		t.Fatal("no lead saved")
	}
	defer pool.Exec(ctx, `DELETE FROM public.contact_lead_deliveries WHERE lead_id=$1`, first.ID)
	defer func() {
		pool.Exec(ctx, `DELETE FROM public.contact_lead_deliveries WHERE lead_id=$1`, first.ID)
		pool.Exec(ctx, `DELETE FROM public.contact_leads WHERE id=$1`, first.ID)
	}()
	var count int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM public.contact_lead_deliveries WHERE lead_id=$1`, first.ID).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if fresh != 1 || count != 2 {
		t.Fatalf("fresh=%d delivery jobs=%d", fresh, count)
	}
	if err := repo.Create(ctx, create("changed-payload")); !errors.Is(err, ErrLeadRequestConflict) {
		t.Fatalf("changed retry accepted: %v", err)
	}
	saved, err := repo.LoadLead(ctx, first.ID.String())
	if err != nil {
		t.Fatal(err)
	}
	if saved.Email != "" || saved.Phone == nil || saved.Reference == "" {
		t.Fatalf("WhatsApp-only brief lost contact/reference")
	}
	job, err := repo.ClaimDelivery(ctx)
	if err != nil || job == nil {
		t.Fatalf("claim=%v err=%v", job, err)
	}
	if err := repo.CompleteDelivery(ctx, job, "retry", 30*time.Second); err != nil {
		t.Fatal(err)
	}
	var status string
	var future bool
	if err := pool.QueryRow(ctx, `SELECT status,next_attempt_at>NOW() FROM public.contact_lead_deliveries WHERE id=$1`, job.ID).Scan(&status, &future); err != nil {
		t.Fatal(err)
	}
	if status != "retry" || !future {
		t.Fatal("retry was not persisted")
	}
	// A crashed worker's lease is reclaimed. The old lease cannot mark it sent.
	pool.Exec(ctx, `UPDATE public.contact_lead_deliveries SET status='processing',lease_until=NOW()-INTERVAL '1 minute',next_attempt_at=NOW()-INTERVAL '1 hour' WHERE id=$1`, job.ID)
	replacement, err := repo.ClaimDelivery(ctx)
	if err != nil || replacement == nil || replacement.ID != job.ID {
		t.Fatalf("reclaim failed: %v %v", replacement, err)
	}
	if err := repo.CompleteDelivery(ctx, job, "sent", 0); err != nil {
		t.Fatal(err)
	}
	if err := pool.QueryRow(ctx, `SELECT status FROM public.contact_lead_deliveries WHERE id=$1`, job.ID).Scan(&status); err != nil {
		t.Fatal(err)
	}
	if status != "processing" {
		t.Fatal("stale lease overwrote current worker")
	}
	if _, err := pool.Exec(ctx, `UPDATE public.contact_lead_deliveries SET status='retry',attempts=1,first_attempt_at=NOW()-INTERVAL '24 hours',lease_until=NULL WHERE lead_id=$1 AND channel='email'`, first.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.ClaimDelivery(ctx); err != nil {
		t.Fatal(err)
	}
	if err := pool.QueryRow(ctx, `SELECT status FROM public.contact_lead_deliveries WHERE lead_id=$1 AND channel='email'`, first.ID).Scan(&status); err != nil {
		t.Fatal(err)
	}
	if status != "failed" {
		t.Fatal("ambiguous email was retried past the provider deduplication window")
	}
}
