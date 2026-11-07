package repository

import (
	"context"
	"fmt"

	"github.com/coreasia/gateway/internal/model"
	"github.com/jackc/pgx/v5"
)

func recordLeadkuInstallation(ctx context.Context, tx pgx.Tx, channel string, p model.LeadkuMobilePulse) error {
	var existing string
	err := tx.QueryRow(ctx, `
		INSERT INTO public.leadku_mobile_installations(id, channel, app_version, version_code, os_version)
		VALUES($1, $2, $3, $4, $5)
		ON CONFLICT(id) DO UPDATE SET app_version = excluded.app_version,
		version_code = excluded.version_code, os_version = excluded.os_version, last_seen = now()
		WHERE leadku_mobile_installations.channel = excluded.channel
		RETURNING channel`, p.InstallationID, channel, p.AppVersion, p.VersionCode, p.OSVersion).Scan(&existing)
	if err != nil {
		return fmt.Errorf("record installation: %w", err)
	}
	return nil
}

// One handoff per installation records its initial route to signup. An expired
// uncompleted ref rotates when the user starts over. Completed refs stay valid
// for idempotent delivery retries but never record a second conversion.
func (r *LeadkuMobileRepo) SignupHandoff(ctx context.Context, channel string, p model.LeadkuMobilePulse, fromDemo bool) (string, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)
	if err := recordLeadkuInstallation(ctx, tx, channel, p); err != nil {
		return "", err
	}
	var ref string
	err = tx.QueryRow(ctx, `
		INSERT INTO public.leadku_signup_handoffs AS existing (installation_id, from_demo)
		VALUES ($1, $2)
		ON CONFLICT (installation_id) DO UPDATE SET
		  ref = CASE WHEN existing.completed_at IS NULL AND existing.expires_at <= now() THEN excluded.ref ELSE existing.ref END,
		  expires_at = CASE WHEN existing.completed_at IS NULL AND existing.expires_at <= now() THEN excluded.expires_at ELSE existing.expires_at END
		RETURNING ref::text`, p.InstallationID, fromDemo).Scan(&ref)
	if err != nil {
		return "", err
	}
	return ref, tx.Commit(ctx)
}

func (r *LeadkuMobileRepo) CompleteSignup(ctx context.Context, ref string) (bool, error) {
	result, err := r.pool.Exec(ctx, `
		UPDATE public.leadku_signup_handoffs
		SET completed_at = coalesce(completed_at, now())
		WHERE ref = $1 AND (completed_at IS NOT NULL OR expires_at > now())`, ref)
	return result.RowsAffected() == 1, err
}

func (r *LeadkuMobileRepo) CreateSetupRequest(ctx context.Context, channel string, p model.LeadkuMobilePulse, request model.LeadkuSetupRequest) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if err := recordLeadkuInstallation(ctx, tx, channel, p); err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO public.leadku_setup_requests(installation_id, contact_channel, contact, topic)
		VALUES($1, $2, $3, $4)
		ON CONFLICT(installation_id, contact_channel, contact, topic) DO NOTHING`, p.InstallationID, request.Channel, request.Contact, request.Topic)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *LeadkuMobileRepo) SetupRequests(ctx context.Context, channel string) ([]model.LeadkuSetupRequest, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT q.id::text, q.contact_channel, q.contact, q.topic, q.created_at
		FROM public.leadku_setup_requests q
		JOIN public.leadku_mobile_installations i ON i.id = q.installation_id
		WHERE i.channel = $1
		ORDER BY q.created_at DESC, q.id DESC
		LIMIT 100`, channel)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, pgx.RowToStructByPos[model.LeadkuSetupRequest])
}

func (r *LeadkuMobileRepo) Funnel(ctx context.Context, channel string) (model.LeadkuMobileFunnel, error) {
	var result model.LeadkuMobileFunnel
	err := r.pool.QueryRow(ctx, `
		WITH cohort AS (
			SELECT e.installation_id
			FROM public.leadku_mobile_events e
			JOIN public.leadku_mobile_installations i ON i.id = e.installation_id
			WHERE i.channel = $1 AND e.kind = 'first_open' AND e.recorded_at >= now() - interval '30 days'
		), engagement AS (
			SELECT e.installation_id,
				bool_or(e.kind = 'welcome_view') AS welcome_view,
				bool_or(e.kind = 'demo_started') AS demo_started,
				bool_or(e.kind = 'demo_key_action') AS demo_key_action,
				bool_or(e.kind = 'guide_opened') AS guide_opened,
				bool_or(e.kind = 'guide_completed') AS guide_completed
			FROM public.leadku_mobile_events e
			JOIN cohort c ON c.installation_id = e.installation_id
			WHERE e.kind IN ('welcome_view', 'demo_started', 'demo_key_action', 'guide_opened', 'guide_completed')
			GROUP BY e.installation_id
		)
		SELECT count(*),
			count(*) FILTER (WHERE e.welcome_view),
			count(*) FILTER (WHERE e.demo_started),
			count(*) FILTER (WHERE e.demo_started AND e.demo_key_action),
			count(*) FILTER (WHERE e.guide_opened),
			count(*) FILTER (WHERE e.guide_opened AND e.guide_completed),
			count(*) FILTER (WHERE h.installation_id IS NOT NULL),
			count(*) FILTER (WHERE NOT h.from_demo),
			count(*) FILTER (WHERE h.from_demo),
			count(*) FILTER (WHERE h.completed_at IS NOT NULL),
			count(*) FILTER (WHERE EXISTS (
				SELECT 1 FROM public.leadku_setup_requests q WHERE q.installation_id = c.installation_id
			))
		FROM cohort c
		LEFT JOIN engagement e ON e.installation_id = c.installation_id
		LEFT JOIN public.leadku_signup_handoffs h ON h.installation_id = c.installation_id`, channel).Scan(
		&result.FirstOpen, &result.WelcomeView, &result.DemoStarted, &result.DemoKeyAction, &result.GuideOpened,
		&result.GuideCompleted, &result.SignupStarted, &result.SignupDirect, &result.SignupViaDemo, &result.SignupCompleted,
		&result.SetupHelpRequested,
	)
	return result, err
}
