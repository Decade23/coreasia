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

type SchemeRepo struct {
	db *postgres.TenantDB
}

func NewSchemeRepo(db *postgres.TenantDB) *SchemeRepo {
	return &SchemeRepo{db: db}
}

func (r *SchemeRepo) FindByID(ctx context.Context, id uuid.UUID) (*entity.Scheme, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var s entity.Scheme
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, code, name, description, is_active, validity_years, created_at, updated_at
		FROM %s.schemes WHERE id = $1`, prefix), id,
	).Scan(&s.ID, &s.Code, &s.Name, &s.Description, &s.IsActive, &s.ValidityYears, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}

	units, err := r.findUnits(ctx, schema, id)
	if err != nil {
		return nil, err
	}
	s.Units = units

	return &s, nil
}

func (r *SchemeRepo) FindAll(ctx context.Context, page, perPage int, search string) ([]entity.Scheme, int, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	offset := (page - 1) * perPage

	args := []interface{}{}
	where := ""
	if search != "" {
		where = " WHERE name ILIKE $1 OR code ILIKE $1"
		args = append(args, "%"+search+"%")
	}

	var total int
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.schemes%s", prefix, where), args...,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf("SELECT id, code, name, description, is_active, validity_years, created_at, updated_at FROM %s.schemes%s ORDER BY created_at DESC LIMIT %d OFFSET %d",
		prefix, where, perPage, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var schemes []entity.Scheme
	for rows.Next() {
		var s entity.Scheme
		if err := rows.Scan(&s.ID, &s.Code, &s.Name, &s.Description, &s.IsActive, &s.ValidityYears, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, 0, err
		}
		schemes = append(schemes, s)
	}

	return schemes, total, rows.Err()
}

func (r *SchemeRepo) Create(ctx context.Context, scheme *entity.Scheme) error {
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

	scheme.CreatedAt = now
	scheme.UpdatedAt = now
	_, err = tx.Exec(ctx,
		`INSERT INTO schemes (id, code, name, description, is_active, validity_years, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		scheme.ID, scheme.Code, scheme.Name, scheme.Description, scheme.IsActive, scheme.ValidityYears, scheme.CreatedAt, scheme.UpdatedAt)
	if err != nil {
		return err
	}

	for i := range scheme.Units {
		unit := &scheme.Units[i]
		if unit.ID == uuid.Nil {
			unit.ID = uuid.New()
		}
		unit.SchemeID = scheme.ID
		_, err = tx.Exec(ctx,
			`INSERT INTO unit_competencies (id, scheme_id, code, title, sort_order)
			VALUES ($1, $2, $3, $4, $5)`,
			unit.ID, unit.SchemeID, unit.Code, unit.Title, unit.SortOrder)
		if err != nil {
			return err
		}

		for j := range unit.Elements {
			elem := &unit.Elements[j]
			if elem.ID == uuid.Nil {
				elem.ID = uuid.New()
			}
			elem.UnitID = unit.ID
			_, err = tx.Exec(ctx,
				`INSERT INTO competency_elements (id, unit_id, title, sort_order)
				VALUES ($1, $2, $3, $4)`,
				elem.ID, elem.UnitID, elem.Title, elem.SortOrder)
			if err != nil {
				return err
			}

			for k := range elem.Criteria {
				crit := &elem.Criteria[k]
				if crit.ID == uuid.Nil {
					crit.ID = uuid.New()
				}
				crit.ElementID = elem.ID
				_, err = tx.Exec(ctx,
					`INSERT INTO performance_criteria (id, element_id, text, sort_order)
					VALUES ($1, $2, $3, $4)`,
					crit.ID, crit.ElementID, crit.Text, crit.SortOrder)
				if err != nil {
					return err
				}
			}
		}
	}

	return tx.Commit(ctx)
}

func (r *SchemeRepo) Update(ctx context.Context, scheme *entity.Scheme) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	scheme.UpdatedAt = time.Now()
	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.schemes SET code=$2, name=$3, description=$4, is_active=$5, validity_years=$6, updated_at=$7 WHERE id=$1`, prefix),
		scheme.ID, scheme.Code, scheme.Name, scheme.Description, scheme.IsActive, scheme.ValidityYears, scheme.UpdatedAt)
	return err
}

func (r *SchemeRepo) Delete(ctx context.Context, id uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("UPDATE %s.schemes SET is_active = false, updated_at = $2 WHERE id = $1", prefix),
		id, time.Now())
	return err
}

func (r *SchemeRepo) findUnits(ctx context.Context, schema string, schemeID uuid.UUID) ([]entity.UnitCompetency, error) {
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf("SELECT id, scheme_id, code, title, sort_order FROM %s.unit_competencies WHERE scheme_id = $1 ORDER BY sort_order", prefix),
		schemeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var units []entity.UnitCompetency
	for rows.Next() {
		var u entity.UnitCompetency
		if err := rows.Scan(&u.ID, &u.SchemeID, &u.Code, &u.Title, &u.SortOrder); err != nil {
			return nil, err
		}

		elements, err := r.findElements(ctx, schema, u.ID)
		if err != nil {
			return nil, err
		}
		u.Elements = elements
		units = append(units, u)
	}

	return units, rows.Err()
}

func (r *SchemeRepo) findElements(ctx context.Context, schema string, unitID uuid.UUID) ([]entity.CompetencyElement, error) {
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf("SELECT id, unit_id, title, sort_order FROM %s.competency_elements WHERE unit_id = $1 ORDER BY sort_order", prefix),
		unitID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var elements []entity.CompetencyElement
	for rows.Next() {
		var e entity.CompetencyElement
		if err := rows.Scan(&e.ID, &e.UnitID, &e.Title, &e.SortOrder); err != nil {
			return nil, err
		}

		criteria, err := r.findCriteria(ctx, schema, e.ID)
		if err != nil {
			return nil, err
		}
		e.Criteria = criteria
		elements = append(elements, e)
	}

	return elements, rows.Err()
}

func (r *SchemeRepo) findCriteria(ctx context.Context, schema string, elementID uuid.UUID) ([]entity.PerformanceCriteria, error) {
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf("SELECT id, element_id, text, sort_order FROM %s.performance_criteria WHERE element_id = $1 ORDER BY sort_order", prefix),
		elementID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var criteria []entity.PerformanceCriteria
	for rows.Next() {
		var c entity.PerformanceCriteria
		if err := rows.Scan(&c.ID, &c.ElementID, &c.Text, &c.SortOrder); err != nil {
			return nil, err
		}
		criteria = append(criteria, c)
	}

	return criteria, rows.Err()
}
