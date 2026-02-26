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

type AssessmentRepo struct {
	db *postgres.TenantDB
}

func NewAssessmentRepo(db *postgres.TenantDB) *AssessmentRepo {
	return &AssessmentRepo{db: db}
}

func (r *AssessmentRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Assessment, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var a entity.Assessment
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, assessee_id, assessor_id, scheme_id, schedule_id, recommendation, assessor_notes, status, submitted_at, created_at
		FROM %s.assessments WHERE id = $1`, prefix), id,
	).Scan(&a.ID, &a.AssesseeID, &a.AssessorID, &a.SchemeID, &a.ScheduleID, &a.Recommendation, &a.AssessorNotes, &a.Status, &a.SubmittedAt, &a.CreatedAt)
	if err != nil {
		return nil, err
	}

	results, err := r.findResults(ctx, schema, id)
	if err != nil {
		return nil, err
	}
	a.Results = results

	return &a, nil
}

func (r *AssessmentRepo) FindAll(ctx context.Context, page, perPage int) ([]entity.Assessment, int, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	offset := (page - 1) * perPage

	var total int
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.assessments", prefix),
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf(`SELECT id, assessee_id, assessor_id, scheme_id, schedule_id, recommendation, assessor_notes, status, submitted_at, created_at
		FROM %s.assessments ORDER BY created_at DESC LIMIT %d OFFSET %d`, prefix, perPage, offset))
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var assessments []entity.Assessment
	for rows.Next() {
		var a entity.Assessment
		if err := rows.Scan(&a.ID, &a.AssesseeID, &a.AssessorID, &a.SchemeID, &a.ScheduleID, &a.Recommendation, &a.AssessorNotes, &a.Status, &a.SubmittedAt, &a.CreatedAt); err != nil {
			return nil, 0, err
		}
		assessments = append(assessments, a)
	}

	return assessments, total, rows.Err()
}

func (r *AssessmentRepo) Create(ctx context.Context, assessment *entity.Assessment) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	assessment.CreatedAt = time.Now()
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s.assessments (id, assessee_id, assessor_id, scheme_id, schedule_id, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`, prefix),
		assessment.ID, assessment.AssesseeID, assessment.AssessorID, assessment.SchemeID, assessment.ScheduleID, assessment.Status, assessment.CreatedAt)
	return err
}

func (r *AssessmentRepo) Update(ctx context.Context, assessment *entity.Assessment) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.assessments SET recommendation=$2, assessor_notes=$3, status=$4, submitted_at=$5 WHERE id=$1`, prefix),
		assessment.ID, assessment.Recommendation, assessment.AssessorNotes, assessment.Status, assessment.SubmittedAt)
	return err
}

func (r *AssessmentRepo) SaveResults(ctx context.Context, assessmentID uuid.UUID, results []entity.AssessmentResult) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	return r.db.ExecInSchema(ctx, schema, func(tx pgx.Tx) error {
		_, err := tx.Exec(ctx, fmt.Sprintf("DELETE FROM %s.assessment_results WHERE assessment_id = $1", prefix), assessmentID)
		if err != nil {
			return err
		}

		for _, res := range results {
			if res.ID == uuid.Nil {
				res.ID = uuid.New()
			}
			_, err := tx.Exec(ctx,
				fmt.Sprintf(`INSERT INTO %s.assessment_results (id, assessment_id, criteria_id, status, evidence_id)
				VALUES ($1, $2, $3, $4, $5)`, prefix),
				res.ID, assessmentID, res.CriteriaID, res.Status, res.EvidenceID)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *AssessmentRepo) findResults(ctx context.Context, schema string, assessmentID uuid.UUID) ([]entity.AssessmentResult, error) {
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf(`SELECT id, assessment_id, criteria_id, status, evidence_id
		FROM %s.assessment_results WHERE assessment_id = $1`, prefix), assessmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []entity.AssessmentResult
	for rows.Next() {
		var res entity.AssessmentResult
		if err := rows.Scan(&res.ID, &res.AssessmentID, &res.CriteriaID, &res.Status, &res.EvidenceID); err != nil {
			return nil, err
		}
		results = append(results, res)
	}

	return results, rows.Err()
}
