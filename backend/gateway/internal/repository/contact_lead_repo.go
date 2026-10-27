package repository

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrLeadRequestConflict = errors.New("request id reused with a different brief")

type ContactLeadRepo struct{ pool *pgxpool.Pool }

func NewContactLeadRepo(pool *pgxpool.Pool) *ContactLeadRepo { return &ContactLeadRepo{pool: pool} }

// Commit the brief and delivery jobs together; retries cannot enqueue duplicates.
func (r *ContactLeadRepo) Create(ctx context.Context, l *model.ContactLead) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	l.ID = uuid.New()
	l.Reference = "CA-" + strings.ToUpper(strings.ReplaceAll(l.ID.String(), "-", "")[:16])
	err = tx.QueryRow(ctx, `INSERT INTO public.contact_leads
 (id,reference,request_id,payload_hash,name,email,phone,subject,message,consent,status,budget_range,
 preferred_contact,timeline,organization,selected_plan,
 utm_source,utm_medium,utm_campaign,utm_content,utm_term,gclid,fbclid,landing_page,referrer)
 VALUES ($1,$2,NULLIF($3,'')::uuid,$4,$5,NULLIF($6,''),$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
 ON CONFLICT(request_id) DO NOTHING
 RETURNING id,consented_at,created_at,updated_at`,
		l.ID, l.Reference, l.RequestID, l.PayloadHash, l.Name, l.Email, l.Phone, l.Subject, l.Message, l.Consent, l.Status, l.BudgetRange,
		l.PreferredContact, l.Timeline, l.Organization, l.SelectedPlan,
		l.UTMSource, l.UTMMedium, l.UTMCampaign, l.UTMContent, l.UTMTerm, l.GCLID, l.FBCLID, l.LandingPage, l.Referrer,
	).Scan(&l.ID, &l.ConsentedAt, &l.CreatedAt, &l.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		var hash string
		if err = tx.QueryRow(ctx, `SELECT id,reference,status,payload_hash,consented_at,created_at,updated_at FROM public.contact_leads WHERE request_id=$1::uuid`, l.RequestID).Scan(&l.ID, &l.Reference, &l.Status, &hash, &l.ConsentedAt, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return err
		}
		if hash != l.PayloadHash {
			return ErrLeadRequestConflict
		}
		l.Replayed = true
	} else if err != nil {
		return err
	}
	if !l.Replayed {
		if _, err = tx.Exec(ctx, `INSERT INTO public.contact_lead_deliveries(lead_id,channel) VALUES ($1,'email'),($1,'crm')`, l.ID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

type LeadDelivery struct {
	ID       int64
	LeadID   string
	Channel  string
	Attempts int
	Token    uuid.UUID
}

func (r *ContactLeadRepo) ClaimDelivery(ctx context.Context) (*LeadDelivery, error) {
	// Resend retains idempotency keys for 24 hours. An ambiguous old attempt
	// must be reviewed instead of automatically sending another alert.
	if _, err := r.pool.Exec(ctx, `UPDATE public.contact_lead_deliveries SET status='failed',last_error='review_expired_email_attempt',lease_token=NULL,lease_until=NULL
 WHERE channel='email' AND attempts>0 AND first_attempt_at<NOW()-INTERVAL '23 hours'
 AND status IN ('retry','blocked','processing') AND (lease_until IS NULL OR lease_until<NOW())`); err != nil {
		return nil, err
	}
	j := &LeadDelivery{Token: uuid.New()}
	err := r.pool.QueryRow(ctx, `UPDATE public.contact_lead_deliveries SET status='processing',attempts=attempts+1,first_attempt_at=COALESCE(first_attempt_at,NOW()),
 lease_until=NOW()+INTERVAL '60 seconds',lease_token=$1
 WHERE id=(SELECT id FROM public.contact_lead_deliveries
 WHERE ((status IN ('pending','retry','blocked') AND next_attempt_at<=NOW()) OR (status='processing' AND lease_until<NOW()))
 ORDER BY next_attempt_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
 RETURNING id,lead_id::text,channel,attempts`, j.Token).Scan(&j.ID, &j.LeadID, &j.Channel, &j.Attempts)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return j, err
}

func (r *ContactLeadRepo) LoadLead(ctx context.Context, id string) (*model.ContactLead, error) {
	var raw []byte
	if err := r.pool.QueryRow(ctx, `SELECT to_jsonb(l) FROM public.contact_leads l WHERE id=$1::uuid`, id).Scan(&raw); err != nil {
		return nil, err
	}
	var l model.ContactLead
	if err := json.Unmarshal(raw, &l); err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *ContactLeadRepo) CompleteDelivery(ctx context.Context, j *LeadDelivery, status string, delay time.Duration) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.contact_lead_deliveries SET status=$1,next_attempt_at=NOW()+$2*INTERVAL '1 second',
 first_attempt_at=CASE WHEN $1='blocked' AND attempts=1 THEN NULL ELSE first_attempt_at END,
 lease_until=NULL,lease_token=NULL,attempts=attempts-CASE WHEN $1='blocked' THEN 1 ELSE 0 END,
 delivered_at=CASE WHEN $1='sent' THEN NOW() ELSE NULL END,
 last_error=CASE WHEN $1='sent' THEN NULL WHEN $1='blocked' THEN 'configuration_missing' ELSE 'delivery_failed' END
 WHERE id=$3 AND lease_token=$4 AND status='processing'`, status, delay.Seconds(), j.ID, j.Token)
	return err
}
