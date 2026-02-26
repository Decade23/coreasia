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

type AssessorRepo struct {
	db *postgres.TenantDB
}

func NewAssessorRepo(db *postgres.TenantDB) *AssessorRepo {
	return &AssessorRepo{db: db}
}

func (r *AssessorRepo) FindByUserID(ctx context.Context, userID uuid.UUID) (*entity.AssessorProfile, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	var p entity.AssessorProfile
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT user_id, specialization, license_number, license_issued_by, license_issued_at, license_expiry_at, license_status
		FROM %s.assessor_profiles WHERE user_id = $1`, prefix), userID,
	).Scan(&p.UserID, &p.Specialization, &p.LicenseNumber, &p.LicenseIssuedBy, &p.LicenseIssuedAt, &p.LicenseExpiryAt, &p.LicenseStatus)
	if err != nil {
		return nil, err
	}

	var u entity.User
	err = r.db.Pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, email, password_hash, full_name, phone_number, role, is_active, last_login_at, created_at, updated_at
		FROM %s.users WHERE id = $1`, prefix), userID,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.PhoneNumber, &u.Role, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	p.User = &u

	schemes, err := r.findSchemes(ctx, schema, userID)
	if err != nil {
		return nil, err
	}
	p.Schemes = schemes

	return &p, nil
}

func (r *AssessorRepo) FindAll(ctx context.Context, page, perPage int, search string) ([]entity.AssessorProfile, int, error) {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()
	offset := (page - 1) * perPage

	args := []interface{}{}
	where := ""
	if search != "" {
		where = " AND (u.full_name ILIKE $1 OR u.email ILIKE $1)"
		args = append(args, "%"+search+"%")
	}

	var total int
	err := r.db.Pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM %s.assessor_profiles ap JOIN %s.users u ON ap.user_id = u.id WHERE 1=1%s", prefix, prefix, where),
		args...,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`SELECT ap.user_id, ap.specialization, ap.license_number, ap.license_issued_by, ap.license_issued_at, ap.license_expiry_at, ap.license_status,
		u.id, u.email, u.password_hash, u.full_name, u.phone_number, u.role, u.is_active, u.last_login_at, u.created_at, u.updated_at
		FROM %s.assessor_profiles ap JOIN %s.users u ON ap.user_id = u.id WHERE 1=1%s
		ORDER BY u.created_at DESC LIMIT %d OFFSET %d`,
		prefix, prefix, where, perPage, offset)

	rows, err := r.db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var profiles []entity.AssessorProfile
	for rows.Next() {
		var p entity.AssessorProfile
		var u entity.User
		if err := rows.Scan(
			&p.UserID, &p.Specialization, &p.LicenseNumber, &p.LicenseIssuedBy, &p.LicenseIssuedAt, &p.LicenseExpiryAt, &p.LicenseStatus,
			&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.PhoneNumber, &u.Role, &u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		p.User = &u
		profiles = append(profiles, p)
	}

	return profiles, total, rows.Err()
}

func (r *AssessorRepo) Create(ctx context.Context, profile *entity.AssessorProfile) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s.assessor_profiles (user_id, specialization, license_number, license_issued_by, license_issued_at, license_expiry_at, license_status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`, prefix),
		profile.UserID, profile.Specialization, profile.LicenseNumber, profile.LicenseIssuedBy, profile.LicenseIssuedAt, profile.LicenseExpiryAt, profile.LicenseStatus)
	return err
}

func (r *AssessorRepo) Update(ctx context.Context, profile *entity.AssessorProfile) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s.assessor_profiles SET specialization=$2, license_number=$3, license_issued_by=$4, license_issued_at=$5, license_expiry_at=$6, license_status=$7 WHERE user_id=$1`, prefix),
		profile.UserID, profile.Specialization, profile.LicenseNumber, profile.LicenseIssuedBy, profile.LicenseIssuedAt, profile.LicenseExpiryAt, profile.LicenseStatus)
	return err
}

func (r *AssessorRepo) AssignScheme(ctx context.Context, assessorID, schemeID uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("INSERT INTO %s.assessor_schemes (assessor_id, scheme_id, assigned_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", prefix),
		assessorID, schemeID, time.Now())
	return err
}

func (r *AssessorRepo) RemoveScheme(ctx context.Context, assessorID, schemeID uuid.UUID) error {
	schema := schemaFromCtx(ctx)
	prefix := pgx.Identifier{schema}.Sanitize()

	_, err := r.db.Pool.Exec(ctx,
		fmt.Sprintf("DELETE FROM %s.assessor_schemes WHERE assessor_id = $1 AND scheme_id = $2", prefix),
		assessorID, schemeID)
	return err
}

func (r *AssessorRepo) findSchemes(ctx context.Context, schema string, assessorID uuid.UUID) ([]entity.Scheme, error) {
	prefix := pgx.Identifier{schema}.Sanitize()

	rows, err := r.db.Pool.Query(ctx,
		fmt.Sprintf(`SELECT s.id, s.code, s.name, s.description, s.is_active, s.validity_years, s.created_at, s.updated_at
		FROM %s.schemes s INNER JOIN %s.assessor_schemes acs ON s.id = acs.scheme_id
		WHERE acs.assessor_id = $1`, prefix, prefix),
		assessorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schemes []entity.Scheme
	for rows.Next() {
		var s entity.Scheme
		if err := rows.Scan(&s.ID, &s.Code, &s.Name, &s.Description, &s.IsActive, &s.ValidityYears, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		schemes = append(schemes, s)
	}

	return schemes, rows.Err()
}
