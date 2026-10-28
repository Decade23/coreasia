package repository

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/coreasia/gateway/internal/model"
	"github.com/jackc/pgx/v5"
	"strings"
)

// Explicit fields only. Keep the body out of list responses; include no internal
// request hashes, attribution or raw delivery errors in the admin response.
const adminBriefJSON = `jsonb_build_object(
 'id',l.id,'reference',COALESCE(NULLIF(l.reference,''),'CA-'||upper(substr(replace(l.id::text,'-',''),1,16))),
 'name',l.name,'email',COALESCE(l.email,''),'phone',COALESCE(l.phone,''),
 'subject',l.subject,'preferred_contact',COALESCE(NULLIF(l.preferred_contact,''),CASE WHEN NULLIF(l.phone,'') IS NOT NULL THEN 'whatsapp' ELSE 'email' END),
 'organization',COALESCE(l.organization,''),'created_at',l.created_at,
 'deliveries',COALESCE((SELECT jsonb_agg(jsonb_build_object('channel',d.channel,'status',d.status,'attempts',d.attempts,'delivered_at',d.delivered_at) ORDER BY d.channel)
 FROM public.contact_lead_deliveries d WHERE d.lead_id=l.id),'[]'::jsonb))`

const adminBriefMatch = `($1='' OR l.name ILIKE $2 OR COALESCE(l.email,'') ILIKE $2 OR COALESCE(l.phone,'') ILIKE $2 OR COALESCE(l.reference,'') ILIKE $2 OR l.organization ILIKE $2)`

func (r *ContactLeadRepo) ListBriefs(ctx context.Context, page, perPage int, search string) ([]model.AdminBrief, int, error) {
	// Escape LIKE metacharacters; all user input remains a bound parameter.
	pattern := "%" + strings.NewReplacer(`\`, `\\`, "%", `\%`, "_", `\_`).Replace(search) + "%"
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT count(*) FROM public.contact_leads l WHERE `+adminBriefMatch, search, pattern).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT `+adminBriefJSON+` FROM public.contact_leads l WHERE `+adminBriefMatch+` ORDER BY l.created_at DESC,l.id DESC LIMIT $3 OFFSET $4`, search, pattern, perPage, (page-1)*perPage)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	briefs := make([]model.AdminBrief, 0)
	for rows.Next() {
		var raw []byte
		if err = rows.Scan(&raw); err != nil {
			return nil, 0, err
		}
		var brief model.AdminBrief
		if err = json.Unmarshal(raw, &brief); err != nil {
			return nil, 0, err
		}
		briefs = append(briefs, brief)
	}
	return briefs, total, rows.Err()
}

func (r *ContactLeadRepo) GetBrief(ctx context.Context, id string) (*model.AdminBrief, error) {
	var raw []byte
	err := r.pool.QueryRow(ctx, `SELECT `+adminBriefJSON+` || jsonb_build_object('message',l.message,'budget_range',COALESCE(l.budget_range,''),'timeline',COALESCE(l.timeline,''),'selected_plan',COALESCE(l.selected_plan,''),'consented_at',l.consented_at) FROM public.contact_leads l WHERE l.id=$1::uuid`, id).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var brief model.AdminBrief
	if err = json.Unmarshal(raw, &brief); err != nil {
		return nil, err
	}
	return &brief, nil
}
