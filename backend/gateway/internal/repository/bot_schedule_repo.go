package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BotScheduleRepo struct {
	pool *pgxpool.Pool
}

func NewBotScheduleRepo(pool *pgxpool.Pool) *BotScheduleRepo {
	return &BotScheduleRepo{pool: pool}
}

const botCols = `id, name, bot_type, schedule, timezone, is_active, last_run_at, last_status, last_error, run_count, config, created_at, updated_at`

func scanBot(row interface{ Scan(dest ...any) error }) (*model.BotSchedule, error) {
	var b model.BotSchedule
	err := row.Scan(&b.ID, &b.Name, &b.BotType, &b.Schedule, &b.Timezone, &b.IsActive,
		&b.LastRunAt, &b.LastStatus, &b.LastError, &b.RunCount, &b.Config, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BotScheduleRepo) FindAll(ctx context.Context) ([]model.BotSchedule, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+botCols+` FROM public.bot_schedules ORDER BY created_at ASC`)
	if err != nil {
		return nil, fmt.Errorf("listing bot schedules: %w", err)
	}
	defer rows.Close()

	var bots []model.BotSchedule
	for rows.Next() {
		b, err := scanBot(rows)
		if err != nil {
			return nil, fmt.Errorf("scanning bot schedule: %w", err)
		}
		bots = append(bots, *b)
	}
	return bots, nil
}

func (r *BotScheduleRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.BotSchedule, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+botCols+` FROM public.bot_schedules WHERE id = $1`, id)
	b, err := scanBot(row)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("finding bot schedule: %w", err)
	}
	return b, nil
}

func (r *BotScheduleRepo) FindActiveByType(ctx context.Context, botType string) (*model.BotSchedule, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+botCols+` FROM public.bot_schedules WHERE bot_type = $1 AND is_active = true LIMIT 1`, botType)
	b, err := scanBot(row)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("finding active bot schedule: %w", err)
	}
	return b, nil
}

func (r *BotScheduleRepo) Create(ctx context.Context, b *model.BotSchedule) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO public.bot_schedules (name, bot_type, schedule, timezone, is_active, config)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, created_at, updated_at`,
		b.Name, b.BotType, b.Schedule, b.Timezone, b.IsActive, b.Config).
		Scan(&b.ID, &b.CreatedAt, &b.UpdatedAt)
}

func (r *BotScheduleRepo) Update(ctx context.Context, b *model.BotSchedule) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE public.bot_schedules
		 SET name = $2, schedule = $3, timezone = $4, is_active = $5, config = $6, updated_at = now()
		 WHERE id = $1`,
		b.ID, b.Name, b.Schedule, b.Timezone, b.IsActive, b.Config)
	return err
}

func (r *BotScheduleRepo) UpdateRunStatus(ctx context.Context, id uuid.UUID, status string, errMsg *string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE public.bot_schedules
		 SET last_run_at = $2, last_status = $3, last_error = $4, run_count = run_count + 1, updated_at = now()
		 WHERE id = $1`,
		id, time.Now(), status, errMsg)
	return err
}

func (r *BotScheduleRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM public.bot_schedules WHERE id = $1`, id)
	return err
}
