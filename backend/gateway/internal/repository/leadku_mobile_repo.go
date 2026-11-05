package repository

import (
	"context"
	"fmt"
	"github.com/coreasia/gateway/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LeadkuMobileRepo struct{ pool *pgxpool.Pool }

func NewLeadkuMobileRepo(pool *pgxpool.Pool) *LeadkuMobileRepo { return &LeadkuMobileRepo{pool} }
func (r *LeadkuMobileRepo) Pulse(ctx context.Context, channel string, p model.LeadkuMobilePulse) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var existing string
	err = tx.QueryRow(ctx, `INSERT INTO public.leadku_mobile_installations(id,channel,app_version,version_code,os_version)
 VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET app_version=excluded.app_version,
 version_code=excluded.version_code,os_version=excluded.os_version,last_seen=now()
 WHERE leadku_mobile_installations.channel=excluded.channel RETURNING channel`, p.InstallationID, channel, p.AppVersion, p.VersionCode, p.OSVersion).Scan(&existing)
	if err != nil {
		return fmt.Errorf("record installation: %w", err)
	}
	for _, e := range p.Events {
		_, err = tx.Exec(ctx, `INSERT INTO public.leadku_mobile_events(id,installation_id,kind,screen,target_code) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING`, e.ID, p.InstallationID, e.Kind, e.Screen, e.TargetCode)
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
func (r *LeadkuMobileRepo) Policy(ctx context.Context, channel string) (model.LeadkuMobilePolicy, error) {
	var p model.LeadkuMobilePolicy
	err := r.pool.QueryRow(ctx, `SELECT channel,latest_code,latest_version,minimum_code,available,notes,updated_at FROM public.leadku_mobile_policy WHERE channel=$1`, channel).Scan(&p.Channel, &p.LatestCode, &p.LatestVersion, &p.MinimumCode, &p.Available, &p.Notes, &p.UpdatedAt)
	return p, err
}
func (r *LeadkuMobileRepo) UpdatePolicy(ctx context.Context, p model.LeadkuMobilePolicy, expected string) (model.LeadkuMobilePolicy, error) {
	var updated model.LeadkuMobilePolicy
	err := r.pool.QueryRow(ctx, `UPDATE public.leadku_mobile_policy SET latest_code=$2,latest_version=$3,minimum_code=$4,available=$5,notes=$6,updated_at=clock_timestamp() WHERE channel=$1 AND updated_at=$7::timestamptz RETURNING channel,latest_code,latest_version,minimum_code,available,notes,updated_at`, p.Channel, p.LatestCode, p.LatestVersion, p.MinimumCode, p.Available, p.Notes, expected).Scan(&updated.Channel, &updated.LatestCode, &updated.LatestVersion, &updated.MinimumCode, &updated.Available, &updated.Notes, &updated.UpdatedAt)
	return updated, err
}
func (r *LeadkuMobileRepo) Summary(ctx context.Context, channel string) (*model.LeadkuMobileSummary, error) {
	s := &model.LeadkuMobileSummary{Channel: channel, Versions: []model.LeadkuMobileVersion{}, Usage: []model.LeadkuMobileUsage{}, Daily: []model.LeadkuMobileDay{}, Play: []model.LeadkuPlayDay{}}
	err := r.pool.QueryRow(ctx, `SELECT count(*),count(*) FILTER(WHERE last_seen>now()-interval '24 hours'),count(*) FILTER(WHERE last_seen>now()-interval '7 days'),count(*) FILTER(WHERE last_seen>now()-interval '30 days'),count(*) FILTER(WHERE first_seen>now()-interval '7 days') FROM public.leadku_mobile_installations WHERE channel=$1`, channel).Scan(&s.Counts.Installations, &s.Counts.Active24h, &s.Counts.Active7d, &s.Counts.Active30d, &s.Counts.New7d)
	if err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `SELECT app_version,version_code,count(*),count(*) FILTER(WHERE last_seen>now()-interval '7 days') FROM public.leadku_mobile_installations WHERE channel=$1 GROUP BY app_version,version_code ORDER BY version_code DESC LIMIT 100`, channel)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var v model.LeadkuMobileVersion
		if err = rows.Scan(&v.Version, &v.Code, &v.Installations, &v.Active7d); err != nil {
			rows.Close()
			return nil, err
		}
		s.Versions = append(s.Versions, v)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return nil, err
	}
	rows, err = r.pool.Query(ctx, `SELECT e.kind,e.screen,count(*),count(DISTINCT e.installation_id) FROM public.leadku_mobile_events e JOIN public.leadku_mobile_installations i ON i.id=e.installation_id WHERE i.channel=$1 AND e.recorded_at>now()-interval '30 days' GROUP BY e.kind,e.screen ORDER BY count(*) DESC LIMIT 200`, channel)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var u model.LeadkuMobileUsage
		if err = rows.Scan(&u.Kind, &u.Screen, &u.Events, &u.Installations); err != nil {
			rows.Close()
			return nil, err
		}
		s.Usage = append(s.Usage, u)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return nil, err
	}
	rows, err = r.pool.Query(ctx, `WITH days AS (SELECT generate_series((now() AT TIME ZONE 'Asia/Jakarta')::date-29, (now() AT TIME ZONE 'Asia/Jakarta')::date, interval '1 day')::date AS day) SELECT to_char(d.day,'YYYY-MM-DD'),count(i.id) FROM days d LEFT JOIN public.leadku_mobile_installations i ON i.channel=$1 AND (i.first_seen AT TIME ZONE 'Asia/Jakarta')::date=d.day GROUP BY d.day ORDER BY d.day`, channel)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var d model.LeadkuMobileDay
		if err = rows.Scan(&d.Day, &d.NewInstallations); err != nil {
			rows.Close()
			return nil, err
		}
		s.Daily = append(s.Daily, d)
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return nil, err
	}
	if channel == "production" {
		rows, err = r.pool.Query(ctx, `SELECT day::text,daily_installs,daily_uninstalls,active_installs,current_installs,source_object,imported_at FROM public.leadku_play_daily ORDER BY day DESC LIMIT 90`)
		if err != nil {
			return nil, err
		}
		for rows.Next() {
			var d model.LeadkuPlayDay
			if err = rows.Scan(&d.Day, &d.Installs, &d.Uninstalls, &d.ActiveInstalls, &d.CurrentInstalls, &d.Source, &d.ImportedAt); err != nil {
				rows.Close()
				return nil, err
			}
			s.Play = append(s.Play, d)
		}
		err = rows.Err()
		rows.Close()
		if err != nil {
			return nil, err
		}
	}
	s.Policy, err = r.Policy(ctx, channel)
	return s, err
}
func (r *LeadkuMobileRepo) ImportPlay(ctx context.Context, days []model.LeadkuPlayDay) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	for _, d := range days {
		_, err = tx.Exec(ctx, `INSERT INTO public.leadku_play_daily(day,daily_installs,daily_uninstalls,active_installs,current_installs,source_object) VALUES($1::date,$2,$3,$4,$5,$6) ON CONFLICT(day) DO UPDATE SET daily_installs=excluded.daily_installs,daily_uninstalls=excluded.daily_uninstalls,active_installs=excluded.active_installs,current_installs=excluded.current_installs,source_object=excluded.source_object,imported_at=now()`, d.Day, d.Installs, d.Uninstalls, d.ActiveInstalls, d.CurrentInstalls, d.Source)
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *LeadkuMobileRepo) PlaySyncStatus(ctx context.Context) (model.LeadkuPlaySyncStatus, error) {
	var s model.LeadkuPlaySyncStatus
	err := r.pool.QueryRow(ctx, `SELECT last_attempt,last_success,error FROM public.leadku_play_sync WHERE id=true`).Scan(&s.LastAttempt, &s.LastSuccess, &s.Error)
	return s, err
}
func (r *LeadkuMobileRepo) RecordPlaySync(ctx context.Context, success bool, message string) error {
	_, err := r.pool.Exec(ctx, `UPDATE public.leadku_play_sync SET last_attempt=now(),last_success=CASE WHEN $1 THEN now() ELSE last_success END,error=$2 WHERE id=true`, success, message)
	return err
}
