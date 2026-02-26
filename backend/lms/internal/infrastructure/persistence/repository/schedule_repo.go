package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/coreasia/lms-api/internal/domain/entity"
	"github.com/coreasia/lms-api/internal/infrastructure/persistence/postgres"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type ScheduleRepo struct {
	db *postgres.TenantDB
}

func NewScheduleRepo(db *postgres.TenantDB) *ScheduleRepo {
	return &ScheduleRepo{db: db}
}

func (r *ScheduleRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Schedule, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var s entity.Schedule
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, title, scheme_id, schedule_type, status, start_date, end_date, location, max_participants, created_at, updated_at
		FROM %s.schedules WHERE id = $1`, prefix), id,
	).Scan(&s.ID, &s.Title, &s.SchemeID, &s.ScheduleType, &s.Status, &s.StartDate, &s.EndDate, &s.Location, &s.MaxParticipants, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}

	assessors, err := r.findAssessors(ctx, schema, id)
	if err != nil {
		return nil, err
	}
	s.Assessors = assessors

	return &s, nil
}

func (r *ScheduleRepo) FindAll(ctx context.Context, page, perPage int, status string) ([]entity.Schedule, int, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	offset := (page - 1) * perPage

	args := []interface{}{}
	where := ""
	if status != "" {
		where = " WHERE status = $1"
		args = append(args, status)
	}

	var total int
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.schedules%s", prefix, where), args...,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT id, title, scheme_id, schedule_type, status, start_date, end_date, location, max_participants, created_at, updated_at
		FROM %s.schedules%s ORDER BY start_date DESC LIMIT %d OFFSET %d`,
		prefix, where, perPage, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var schedules []entity.Schedule
	for rows.Next() {
		var s entity.Schedule
		if err := rows.Scan(&s.ID, &s.Title, &s.SchemeID, &s.ScheduleType, &s.Status, &s.StartDate, &s.EndDate, &s.Location, &s.MaxParticipants, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, 0, err
		}
		schedules = append(schedules, s)
	}

	return schedules, total, rows.Err()
}

func (r *ScheduleRepo) Create(ctx context.Context, schedule *entity.Schedule) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	now := time.Now()

	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, fmt.Sprintf("SET search_path TO %s, public", prefix))
	if err != nil {
		return err
	}

	schedule.CreatedAt = now
	schedule.UpdatedAt = now
	_, err = tx.Exec(ctx,
		`INSERT INTO schedules (id, title, scheme_id, schedule_type, status, start_date, end_date, location, max_participants, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		schedule.ID, schedule.Title, schedule.SchemeID, schedule.ScheduleType, schedule.Status,
		schedule.StartDate, schedule.EndDate, schedule.Location, schedule.MaxParticipants, schedule.CreatedAt, schedule.UpdatedAt)
	if err != nil {
		return err
	}

	for _, assessor := range schedule.Assessors {
		_, err = tx.Exec(ctx,
			`INSERT INTO schedule_assessors (schedule_id, assessor_id) VALUES ($1, $2)`,
			schedule.ID, assessor.ID)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *ScheduleRepo) Update(ctx context.Context, schedule *entity.Schedule) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	schedule.UpdatedAt = time.Now()
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.schedules SET title=$2, schedule_type=$3, status=$4, start_date=$5, end_date=$6, location=$7, max_participants=$8, updated_at=$9 WHERE id=$1`, prefix),
		schedule.ID, schedule.Title, schedule.ScheduleType, schedule.Status, schedule.StartDate, schedule.EndDate, schedule.Location, schedule.MaxParticipants, schedule.UpdatedAt)
	return err
}

func (r *ScheduleRepo) Delete(ctx context.Context, id uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("DELETE FROM %s.schedules WHERE id = $1", prefix), id)
	return err
}

func (r *ScheduleRepo) AssignAssessor(ctx context.Context, scheduleID, assessorID uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("INSERT INTO %s.schedule_assessors (schedule_id, assessor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", prefix),
		scheduleID, assessorID)
	return err
}

func (r *ScheduleRepo) RemoveAssessor(ctx context.Context, scheduleID, assessorID uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("DELETE FROM %s.schedule_assessors WHERE schedule_id = $1 AND assessor_id = $2", prefix),
		scheduleID, assessorID)
	return err
}

func (r *ScheduleRepo) findAssessors(ctx context.Context, schema string, scheduleID uuid.UUID) ([]entity.User, error) {
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf(`SELECT u.id, u.email, u.password_hash, u.full_name, u.phone_number, u.role, u.is_active, u.last_login_at, u.created_at, u.updated_at
		FROM %s.users u INNER JOIN %s.schedule_assessors sa ON u.id = sa.assessor_id
		WHERE sa.schedule_id = $1`, prefix, prefix),
		scheduleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assessors []entity.User
	for rows.Next() {
		var u entity.User
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.PhoneNumber, &u.Role, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		assessors = append(assessors, u)
	}

	return assessors, rows.Err()
}
