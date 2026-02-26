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

type CertificateRepo struct {
	db *postgres.TenantDB
}

func NewCertificateRepo(db *postgres.TenantDB) *CertificateRepo {
	return &CertificateRepo{db: db}
}

func (r *CertificateRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Certificate, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var c entity.Certificate
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, certificate_number, assessee_id, scheme_id, template_id, assessor_id, status, issued_date, expiry_date, download_url, qr_code_data, created_at
		FROM %s.certificates WHERE id = $1`, prefix), id,
	).Scan(&c.ID, &c.CertificateNumber, &c.AssesseeID, &c.SchemeID, &c.TemplateID, &c.AssessorID, &c.Status, &c.IssuedDate, &c.ExpiryDate, &c.DownloadURL, &c.QRCodeData, &c.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &c, nil
}

func (r *CertificateRepo) FindByNumber(ctx context.Context, number string) (*entity.Certificate, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var c entity.Certificate
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, certificate_number, assessee_id, scheme_id, template_id, assessor_id, status, issued_date, expiry_date, download_url, qr_code_data, created_at
		FROM %s.certificates WHERE certificate_number = $1`, prefix), number,
	).Scan(&c.ID, &c.CertificateNumber, &c.AssesseeID, &c.SchemeID, &c.TemplateID, &c.AssessorID, &c.Status, &c.IssuedDate, &c.ExpiryDate, &c.DownloadURL, &c.QRCodeData, &c.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &c, nil
}

func (r *CertificateRepo) FindAll(ctx context.Context, page, perPage int, assesseeID *uuid.UUID) ([]entity.Certificate, int, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	offset := (page - 1) * perPage

	args := []interface{}{}
	where := ""
	if assesseeID != nil {
		where = " WHERE assessee_id = $1"
		args = append(args, *assesseeID)
	}

	var total int
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.certificates%s", prefix, where), args...,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT id, certificate_number, assessee_id, scheme_id, template_id, assessor_id, status, issued_date, expiry_date, download_url, qr_code_data, created_at
		FROM %s.certificates%s ORDER BY created_at DESC LIMIT %d OFFSET %d`,
		prefix, where, perPage, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var certs []entity.Certificate
	for rows.Next() {
		var c entity.Certificate
		if err := rows.Scan(&c.ID, &c.CertificateNumber, &c.AssesseeID, &c.SchemeID, &c.TemplateID, &c.AssessorID, &c.Status, &c.IssuedDate, &c.ExpiryDate, &c.DownloadURL, &c.QRCodeData, &c.CreatedAt); err != nil {
			return nil, 0, err
		}
		certs = append(certs, c)
	}

	return certs, total, rows.Err()
}

func (r *CertificateRepo) Create(ctx context.Context, cert *entity.Certificate) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	cert.CreatedAt = time.Now()
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s.certificates (id, certificate_number, assessee_id, scheme_id, template_id, assessor_id, status, issued_date, expiry_date, download_url, qr_code_data, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, prefix),
		cert.ID, cert.CertificateNumber, cert.AssesseeID, cert.SchemeID, cert.TemplateID, cert.AssessorID, cert.Status, cert.IssuedDate, cert.ExpiryDate, cert.DownloadURL, cert.QRCodeData, cert.CreatedAt)
	return err
}

func (r *CertificateRepo) Update(ctx context.Context, cert *entity.Certificate) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.certificates SET status=$2, download_url=$3, qr_code_data=$4 WHERE id=$1`, prefix),
		cert.ID, cert.Status, cert.DownloadURL, cert.QRCodeData)
	return err
}
