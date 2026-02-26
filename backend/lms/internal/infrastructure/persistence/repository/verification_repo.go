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

type VerificationRepo struct {
	db *postgres.TenantDB
}

func NewVerificationRepo(db *postgres.TenantDB) *VerificationRepo {
	return &VerificationRepo{db: db}
}

func (r *VerificationRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Verification, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var v entity.Verification
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, assessee_id, scheme_id, status, personal_data, review_notes, reviewed_by, submitted_at, reviewed_at, created_at, updated_at
		FROM %s.verifications WHERE id = $1`, prefix), id,
	).Scan(&v.ID, &v.AssesseeID, &v.SchemeID, &v.Status, &v.PersonalData, &v.ReviewNotes, &v.ReviewedBy, &v.SubmittedAt, &v.ReviewedAt, &v.CreatedAt, &v.UpdatedAt)
	if err != nil {
		return nil, err
	}

	docs, err := r.findDocuments(ctx, schema, id)
	if err != nil {
		return nil, err
	}
	v.Documents = docs

	var u entity.User
	err = r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, email, password_hash, full_name, phone_number, role, is_active, last_login_at, created_at, updated_at
		FROM %s.users WHERE id = $1`, prefix), v.AssesseeID,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.PhoneNumber, &u.Role, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		v.Assessee = &u
	}

	return &v, nil
}

func (r *VerificationRepo) FindAll(ctx context.Context, page, perPage int, status string) ([]entity.Verification, int, error) {
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
		fmt.Sprintf("SELECT COUNT(*) FROM %s.verifications%s", prefix, where), args...,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT v.id, v.assessee_id, v.scheme_id, v.status, v.personal_data, v.review_notes, v.reviewed_by, v.submitted_at, v.reviewed_at, v.created_at, v.updated_at,
		u.id, u.email, u.password_hash, u.full_name, u.phone_number, u.role, u.is_active, u.last_login_at, u.created_at, u.updated_at
		FROM %s.verifications v LEFT JOIN %s.users u ON v.assessee_id = u.id%s ORDER BY v.created_at DESC LIMIT %d OFFSET %d`,
		prefix, prefix, where, perPage, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var verifications []entity.Verification
	for rows.Next() {
		var v entity.Verification
		var u entity.User
		if err := rows.Scan(
			&v.ID, &v.AssesseeID, &v.SchemeID, &v.Status, &v.PersonalData, &v.ReviewNotes, &v.ReviewedBy, &v.SubmittedAt, &v.ReviewedAt, &v.CreatedAt, &v.UpdatedAt,
			&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.PhoneNumber, &u.Role, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		v.Assessee = &u
		verifications = append(verifications, v)
	}

	return verifications, total, rows.Err()
}

func (r *VerificationRepo) CountByStatus(ctx context.Context) (map[string]int, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf("SELECT status, COUNT(*) FROM %s.verifications GROUP BY status", prefix))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		counts[status] = count
	}

	return counts, rows.Err()
}

func (r *VerificationRepo) Create(ctx context.Context, v *entity.Verification) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	now := time.Now()

	v.CreatedAt = now
	v.UpdatedAt = now
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s.verifications (id, assessee_id, scheme_id, status, personal_data, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`, prefix),
		v.ID, v.AssesseeID, v.SchemeID, v.Status, v.PersonalData, v.CreatedAt, v.UpdatedAt)
	return err
}

func (r *VerificationRepo) Update(ctx context.Context, v *entity.Verification) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	v.UpdatedAt = time.Now()
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.verifications SET status=$2, review_notes=$3, reviewed_by=$4, reviewed_at=$5, updated_at=$6 WHERE id=$1`, prefix),
		v.ID, v.Status, v.ReviewNotes, v.ReviewedBy, v.ReviewedAt, v.UpdatedAt)
	return err
}

func (r *VerificationRepo) AddDocument(ctx context.Context, doc *entity.VerificationDocument) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s.verification_documents (id, verification_id, name, document_type, file_url, file_size, uploaded_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`, prefix),
		doc.ID, doc.VerificationID, doc.Name, doc.DocumentType, doc.FileURL, doc.FileSize, time.Now())
	return err
}

func (r *VerificationRepo) findDocuments(ctx context.Context, schema string, verificationID uuid.UUID) ([]entity.VerificationDocument, error) {
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf("SELECT id, verification_id, name, document_type, file_url, file_size, uploaded_at FROM %s.verification_documents WHERE verification_id = $1 ORDER BY uploaded_at", prefix),
		verificationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var docs []entity.VerificationDocument
	for rows.Next() {
		var d entity.VerificationDocument
		if err := rows.Scan(&d.ID, &d.VerificationID, &d.Name, &d.DocumentType, &d.FileURL, &d.FileSize, &d.UploadedAt); err != nil {
			return nil, err
		}
		docs = append(docs, d)
	}

	return docs, rows.Err()
}
