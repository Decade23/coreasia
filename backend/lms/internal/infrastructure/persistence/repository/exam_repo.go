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

type ExamRepo struct {
	db *postgres.TenantDB
}

func NewExamRepo(db *postgres.TenantDB) *ExamRepo {
	return &ExamRepo{db: db}
}

func (r *ExamRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Exam, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var e entity.Exam
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, assessee_id, schedule_id, scheme_id, status, started_at, submitted_at, score, created_at
		FROM %s.exams WHERE id = $1`, prefix), id,
	).Scan(&e.ID, &e.AssesseeID, &e.ScheduleID, &e.SchemeID, &e.Status, &e.StartedAt, &e.SubmittedAt, &e.Score, &e.CreatedAt)
	if err != nil {
		return nil, err
	}

	answers, err := r.findAnswers(ctx, schema, id)
	if err != nil {
		return nil, err
	}
	e.Answers = answers

	return &e, nil
}

func (r *ExamRepo) FindByAssessee(ctx context.Context, assesseeID uuid.UUID) ([]entity.Exam, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf(`SELECT id, assessee_id, schedule_id, scheme_id, status, started_at, submitted_at, score, created_at
		FROM %s.exams WHERE assessee_id = $1 ORDER BY created_at DESC`, prefix), assesseeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exams []entity.Exam
	for rows.Next() {
		var e entity.Exam
		if err := rows.Scan(&e.ID, &e.AssesseeID, &e.ScheduleID, &e.SchemeID, &e.Status, &e.StartedAt, &e.SubmittedAt, &e.Score, &e.CreatedAt); err != nil {
			return nil, err
		}
		exams = append(exams, e)
	}

	return exams, rows.Err()
}

func (r *ExamRepo) Create(ctx context.Context, exam *entity.Exam) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	exam.CreatedAt = time.Now()
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s.exams (id, assessee_id, schedule_id, scheme_id, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`, prefix),
		exam.ID, exam.AssesseeID, exam.ScheduleID, exam.SchemeID, exam.Status, exam.CreatedAt)
	return err
}

func (r *ExamRepo) Update(ctx context.Context, exam *entity.Exam) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.exams SET status=$2, started_at=$3, submitted_at=$4, score=$5 WHERE id=$1`, prefix),
		exam.ID, exam.Status, exam.StartedAt, exam.SubmittedAt, exam.Score)
	return err
}

func (r *ExamRepo) SaveAnswers(ctx context.Context, examID uuid.UUID, answers []entity.ExamAnswer) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	return r.db.ExecInSchema(ctx, schema, func(tx pgx.Tx) error {
		// Delete existing answers for this exam, then re-insert
		_, err := tx.Exec(ctx, fmt.Sprintf("DELETE FROM %s.exam_answers WHERE exam_id = $1", prefix), examID)
		if err != nil {
			return err
		}

		for _, a := range answers {
			if a.ID == uuid.Nil {
				a.ID = uuid.New()
			}
			_, err := tx.Exec(ctx,
				fmt.Sprintf(`INSERT INTO %s.exam_answers (id, exam_id, question_id, answer_text, selected_option_id, file_url)
				VALUES ($1, $2, $3, $4, $5, $6)`, prefix),
				a.ID, examID, a.QuestionID, a.AnswerText, a.SelectedOptionID, a.FileURL)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *ExamRepo) SubmitExam(ctx context.Context, examID uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	now := time.Now()
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.exams SET status='submitted', submitted_at=$2 WHERE id=$1`, prefix),
		examID, now)
	return err
}

func (r *ExamRepo) findAnswers(ctx context.Context, schema string, examID uuid.UUID) ([]entity.ExamAnswer, error) {
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf(`SELECT id, exam_id, question_id, answer_text, selected_option_id, file_url, points_awarded, graded_by, graded_at
		FROM %s.exam_answers WHERE exam_id = $1`, prefix), examID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var answers []entity.ExamAnswer
	for rows.Next() {
		var a entity.ExamAnswer
		if err := rows.Scan(&a.ID, &a.ExamID, &a.QuestionID, &a.AnswerText, &a.SelectedOptionID, &a.FileURL, &a.PointsAwarded, &a.GradedBy, &a.GradedAt); err != nil {
			return nil, err
		}
		answers = append(answers, a)
	}

	return answers, rows.Err()
}
