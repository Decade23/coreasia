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

type CertificateTemplateRepo struct {
	db *postgres.TenantDB
}

func NewCertificateTemplateRepo(db *postgres.TenantDB) *CertificateTemplateRepo {
	return &CertificateTemplateRepo{db: db}
}

func (r *CertificateTemplateRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.CertificateTemplate, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var t entity.CertificateTemplate
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, name, description, scheme_id, thumbnail_url, is_default, created_at, updated_at
		FROM %s.certificate_templates WHERE id = $1`, prefix), id,
	).Scan(&t.ID, &t.Name, &t.Description, &t.SchemeID, &t.ThumbnailURL, &t.IsDefault, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}

	fields, err := r.findFields(ctx, schema, id)
	if err != nil {
		return nil, err
	}
	t.Fields = fields

	return &t, nil
}

func (r *CertificateTemplateRepo) FindAll(ctx context.Context) ([]entity.CertificateTemplate, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf(`SELECT id, name, description, scheme_id, thumbnail_url, is_default, created_at, updated_at
		FROM %s.certificate_templates ORDER BY created_at DESC`, prefix))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []entity.CertificateTemplate
	for rows.Next() {
		var t entity.CertificateTemplate
		if err := rows.Scan(&t.ID, &t.Name, &t.Description, &t.SchemeID, &t.ThumbnailURL, &t.IsDefault, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}

		fields, err := r.findFields(ctx, schema, t.ID)
		if err != nil {
			return nil, err
		}
		t.Fields = fields

		templates = append(templates, t)
	}

	return templates, rows.Err()
}

func (r *CertificateTemplateRepo) Create(ctx context.Context, tmpl *entity.CertificateTemplate) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	now := time.Now()
	tmpl.CreatedAt = now
	tmpl.UpdatedAt = now

	return r.db.ExecInSchema(ctx, schema, func(tx pgx.Tx) error {
		_, err := tx.Exec(ctx,
			fmt.Sprintf(`INSERT INTO %s.certificate_templates (id, name, description, scheme_id, thumbnail_url, is_default, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, prefix),
			tmpl.ID, tmpl.Name, tmpl.Description, tmpl.SchemeID, tmpl.ThumbnailURL, tmpl.IsDefault, tmpl.CreatedAt, tmpl.UpdatedAt)
		if err != nil {
			return err
		}

		for _, f := range tmpl.Fields {
			if f.ID == uuid.Nil {
				f.ID = uuid.New()
			}
			_, err := tx.Exec(ctx,
				fmt.Sprintf(`INSERT INTO %s.certificate_template_fields (id, template_id, field_key, label, field_type, position_x, position_y, font_size, sort_order)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, prefix),
				f.ID, tmpl.ID, f.FieldKey, f.Label, f.FieldType, f.PositionX, f.PositionY, f.FontSize, f.SortOrder)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *CertificateTemplateRepo) Update(ctx context.Context, tmpl *entity.CertificateTemplate) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	tmpl.UpdatedAt = time.Now()

	return r.db.ExecInSchema(ctx, schema, func(tx pgx.Tx) error {
		_, err := tx.Exec(ctx,
			fmt.Sprintf(`UPDATE %s.certificate_templates SET name=$2, description=$3, scheme_id=$4, is_default=$5, updated_at=$6 WHERE id=$1`, prefix),
			tmpl.ID, tmpl.Name, tmpl.Description, tmpl.SchemeID, tmpl.IsDefault, tmpl.UpdatedAt)
		if err != nil {
			return err
		}

		// Replace fields
		_, err = tx.Exec(ctx, fmt.Sprintf("DELETE FROM %s.certificate_template_fields WHERE template_id = $1", prefix), tmpl.ID)
		if err != nil {
			return err
		}

		for _, f := range tmpl.Fields {
			if f.ID == uuid.Nil {
				f.ID = uuid.New()
			}
			_, err := tx.Exec(ctx,
				fmt.Sprintf(`INSERT INTO %s.certificate_template_fields (id, template_id, field_key, label, field_type, position_x, position_y, font_size, sort_order)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, prefix),
				f.ID, tmpl.ID, f.FieldKey, f.Label, f.FieldType, f.PositionX, f.PositionY, f.FontSize, f.SortOrder)
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *CertificateTemplateRepo) Delete(ctx context.Context, id uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("DELETE FROM %s.certificate_templates WHERE id = $1", prefix), id)
	return err
}

func (r *CertificateTemplateRepo) findFields(ctx context.Context, schema string, templateID uuid.UUID) ([]entity.CertificateTemplateField, error) {
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf(`SELECT id, template_id, field_key, label, field_type, position_x, position_y, font_size, sort_order
		FROM %s.certificate_template_fields WHERE template_id = $1 ORDER BY sort_order`, prefix), templateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fields []entity.CertificateTemplateField
	for rows.Next() {
		var f entity.CertificateTemplateField
		if err := rows.Scan(&f.ID, &f.TemplateID, &f.FieldKey, &f.Label, &f.FieldType, &f.PositionX, &f.PositionY, &f.FontSize, &f.SortOrder); err != nil {
			return nil, err
		}
		fields = append(fields, f)
	}

	return fields, rows.Err()
}
