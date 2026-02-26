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

type QualityRepo struct {
	db *postgres.TenantDB
}

func NewQualityRepo(db *postgres.TenantDB) *QualityRepo {
	return &QualityRepo{db: db}
}

func (r *QualityRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.QualityReview, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var q entity.QualityReview
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, assessment_id, assessee_id, assessor_id, scheme_id, recommendation, assessor_notes, manager_notes, status, reviewed_by, submitted_at, reviewed_at
		FROM %s.quality_reviews WHERE id = $1`, prefix), id,
	).Scan(&q.ID, &q.AssessmentID, &q.AssesseeID, &q.AssessorID, &q.SchemeID, &q.Recommendation, &q.AssessorNotes, &q.ManagerNotes, &q.Status, &q.ReviewedBy, &q.SubmittedAt, &q.ReviewedAt)
	if err != nil {
		return nil, err
	}

	return &q, nil
}

func (r *QualityRepo) FindAll(ctx context.Context, page, perPage int, status string) ([]entity.QualityReview, int, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	offset := (page - 1) * perPage

	args := []interface{}{}
	where := ""
	if status != "" {
		where = " WHERE qr.status = $1"
		args = append(args, status)
	}

	var total int
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.quality_reviews qr%s", prefix, where), args...,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT qr.id, qr.assessment_id, qr.assessee_id, qr.assessor_id, qr.scheme_id,
		qr.recommendation, qr.assessor_notes, qr.manager_notes, qr.status, qr.reviewed_by, qr.submitted_at, qr.reviewed_at
		FROM %s.quality_reviews qr%s ORDER BY qr.submitted_at DESC LIMIT %d OFFSET %d`,
		prefix, where, perPage, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var reviews []entity.QualityReview
	for rows.Next() {
		var q entity.QualityReview
		if err := rows.Scan(&q.ID, &q.AssessmentID, &q.AssesseeID, &q.AssessorID, &q.SchemeID,
			&q.Recommendation, &q.AssessorNotes, &q.ManagerNotes, &q.Status, &q.ReviewedBy, &q.SubmittedAt, &q.ReviewedAt); err != nil {
			return nil, 0, err
		}
		reviews = append(reviews, q)
	}

	return reviews, total, rows.Err()
}

func (r *QualityRepo) Create(ctx context.Context, review *entity.QualityReview) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	review.SubmittedAt = time.Now()
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s.quality_reviews (id, assessment_id, assessee_id, assessor_id, scheme_id, recommendation, assessor_notes, status, submitted_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, prefix),
		review.ID, review.AssessmentID, review.AssesseeID, review.AssessorID, review.SchemeID,
		review.Recommendation, review.AssessorNotes, review.Status, review.SubmittedAt)
	return err
}

func (r *QualityRepo) Update(ctx context.Context, review *entity.QualityReview) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.quality_reviews SET manager_notes=$2, status=$3, reviewed_by=$4, reviewed_at=$5 WHERE id=$1`, prefix),
		review.ID, review.ManagerNotes, review.Status, review.ReviewedBy, review.ReviewedAt)
	return err
}

func (r *QualityRepo) Stats(ctx context.Context) (map[string]interface{}, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	stats := make(map[string]interface{})

	// Total assessments and recommendation counts
	var totalAssessments, competentCount, notCompetentCount int
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT COUNT(*), COALESCE(SUM(CASE WHEN recommendation='competent' THEN 1 ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN recommendation='not_competent' THEN 1 ELSE 0 END), 0)
		FROM %s.quality_reviews`, prefix),
	).Scan(&totalAssessments, &competentCount, &notCompetentCount)
	if err != nil {
		return nil, err
	}

	stats["total_assessments"] = totalAssessments
	stats["competent_count"] = competentCount
	stats["not_competent_count"] = notCompetentCount

	var passRate float64
	if totalAssessments > 0 {
		passRate = float64(competentCount) / float64(totalAssessments) * 100
	}
	stats["pass_rate"] = passRate

	// Pending reviews
	var pendingReviews int
	err = r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.quality_reviews WHERE status = 'pending_review'", prefix),
	).Scan(&pendingReviews)
	if err != nil {
		return nil, err
	}
	stats["pending_reviews"] = pendingReviews

	// Scheme breakdown
	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf(`SELECT s.name, COUNT(*) as total,
		COALESCE(SUM(CASE WHEN qr.recommendation='competent' THEN 1 ELSE 0 END), 0) as competent
		FROM %s.quality_reviews qr JOIN %s.schemes s ON qr.scheme_id = s.id
		GROUP BY s.name ORDER BY total DESC`, prefix, prefix))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var breakdown []map[string]interface{}
	for rows.Next() {
		var schemeName string
		var total, competent int
		if err := rows.Scan(&schemeName, &total, &competent); err != nil {
			return nil, err
		}
		var rate float64
		if total > 0 {
			rate = float64(competent) / float64(total) * 100
		}
		breakdown = append(breakdown, map[string]interface{}{
			"scheme_name": schemeName,
			"total":       total,
			"competent":   competent,
			"pass_rate":   rate,
		})
	}
	stats["scheme_breakdown"] = breakdown

	return stats, rows.Err()
}
