package repository

import (
	"context"
	"fmt"

	"github.com/coreasia/gateway/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ContactLeadRepo struct {
	pool *pgxpool.Pool
}

func NewContactLeadRepo(pool *pgxpool.Pool) *ContactLeadRepo {
	return &ContactLeadRepo{pool: pool}
}

// Create inserts the lead and only returns after PostgreSQL has acknowledged
// the write. The handler must not report success if this call fails.
func (r *ContactLeadRepo) Create(ctx context.Context, lead *model.ContactLead) error {
	const query = `
		INSERT INTO public.contact_leads (
			name, email, phone, subject, message, consent, status,
			utm_source, utm_medium, utm_campaign, utm_content, utm_term,
			gclid, fbclid, landing_page, referrer
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12,
			$13, $14, $15, $16
		)
		RETURNING id, status, consented_at, created_at, updated_at
	`

	err := r.pool.QueryRow(ctx, query,
		lead.Name,
		lead.Email,
		lead.Phone,
		lead.Subject,
		lead.Message,
		lead.Consent,
		lead.Status,
		lead.UTMSource,
		lead.UTMMedium,
		lead.UTMCampaign,
		lead.UTMContent,
		lead.UTMTerm,
		lead.GCLID,
		lead.FBCLID,
		lead.LandingPage,
		lead.Referrer,
	).Scan(
		&lead.ID,
		&lead.Status,
		&lead.ConsentedAt,
		&lead.CreatedAt,
		&lead.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("creating contact lead: %w", err)
	}

	return nil
}
