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

type QuestionRepo struct {
	db *postgres.TenantDB
}

func NewQuestionRepo(db *postgres.TenantDB) *QuestionRepo {
	return &QuestionRepo{db: db}
}

func (r *QuestionRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Question, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var q entity.Question
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, scheme_id, question_type, question_text, difficulty, points, is_active, rubric, instructions, created_at, updated_at
		FROM %s.questions WHERE id = $1`, prefix), id,
	).Scan(&q.ID, &q.SchemeID, &q.QuestionType, &q.QuestionText, &q.Difficulty, &q.Points, &q.IsActive, &q.Rubric, &q.Instructions, &q.CreatedAt, &q.UpdatedAt)
	if err != nil {
		return nil, err
	}

	options, err := r.findOptions(ctx, schema, id)
	if err != nil {
		return nil, err
	}
	q.Options = options

	return &q, nil
}

func (r *QuestionRepo) FindAll(ctx context.Context, page, perPage int, schemeID *uuid.UUID, questionType, difficulty string) ([]entity.Question, int, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	offset := (page - 1) * perPage

	where := ""
	args := []interface{}{}
	argIdx := 1

	if schemeID != nil {
		where += fmt.Sprintf(" WHERE scheme_id = $%d", argIdx)
		args = append(args, *schemeID)
		argIdx++
	}

	if questionType != "" {
		if where == "" {
			where += " WHERE"
		} else {
			where += " AND"
		}
		where += fmt.Sprintf(" question_type = $%d", argIdx)
		args = append(args, questionType)
		argIdx++
	}

	if difficulty != "" {
		if where == "" {
			where += " WHERE"
		} else {
			where += " AND"
		}
		where += fmt.Sprintf(" difficulty = $%d", argIdx)
		args = append(args, difficulty)
		argIdx++
	}

	var total int
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.questions%s", prefix, where), args...,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT id, scheme_id, question_type, question_text, difficulty, points, is_active, rubric, instructions, created_at, updated_at
		FROM %s.questions%s ORDER BY created_at DESC LIMIT %d OFFSET %d`,
		prefix, where, perPage, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var questions []entity.Question
	for rows.Next() {
		var q entity.Question
		if err := rows.Scan(&q.ID, &q.SchemeID, &q.QuestionType, &q.QuestionText, &q.Difficulty, &q.Points, &q.IsActive, &q.Rubric, &q.Instructions, &q.CreatedAt, &q.UpdatedAt); err != nil {
			return nil, 0, err
		}
		questions = append(questions, q)
	}

	return questions, total, rows.Err()
}

func (r *QuestionRepo) Create(ctx context.Context, question *entity.Question) error {
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

	question.CreatedAt = now
	question.UpdatedAt = now
	_, err = tx.Exec(ctx,
		`INSERT INTO questions (id, scheme_id, question_type, question_text, difficulty, points, is_active, rubric, instructions, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		question.ID, question.SchemeID, question.QuestionType, question.QuestionText, question.Difficulty,
		question.Points, question.IsActive, question.Rubric, question.Instructions, question.CreatedAt, question.UpdatedAt)
	if err != nil {
		return err
	}

	for i := range question.Options {
		opt := &question.Options[i]
		if opt.ID == uuid.Nil {
			opt.ID = uuid.New()
		}
		opt.QuestionID = question.ID
		_, err = tx.Exec(ctx,
			`INSERT INTO question_options (id, question_id, text, is_correct, sort_order)
			VALUES ($1, $2, $3, $4, $5)`,
			opt.ID, opt.QuestionID, opt.Text, opt.IsCorrect, opt.SortOrder)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *QuestionRepo) Update(ctx context.Context, question *entity.Question) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	question.UpdatedAt = time.Now()
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.questions SET question_type=$2, question_text=$3, difficulty=$4, points=$5, is_active=$6, rubric=$7, instructions=$8, updated_at=$9 WHERE id=$1`, prefix),
		question.ID, question.QuestionType, question.QuestionText, question.Difficulty, question.Points,
		question.IsActive, question.Rubric, question.Instructions, question.UpdatedAt)
	return err
}

func (r *QuestionRepo) Delete(ctx context.Context, id uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("UPDATE %s.questions SET is_active = false, updated_at = $2 WHERE id = $1", prefix),
		id, time.Now())
	return err
}

func (r *QuestionRepo) findOptions(ctx context.Context, schema string, questionID uuid.UUID) ([]entity.QuestionOption, error) {
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf("SELECT id, question_id, text, is_correct, sort_order FROM %s.question_options WHERE question_id = $1 ORDER BY sort_order", prefix),
		questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var options []entity.QuestionOption
	for rows.Next() {
		var o entity.QuestionOption
		if err := rows.Scan(&o.ID, &o.QuestionID, &o.Text, &o.IsCorrect, &o.SortOrder); err != nil {
			return nil, err
		}
		options = append(options, o)
	}

	return options, rows.Err()
}
