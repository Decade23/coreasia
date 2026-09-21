package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// adminUserDB dipenuhi *pgxpool.Pool (produksi) dan pgx.Tx (uji yang selalu
// di-ROLLBACK, lihat admin_user_repo_test.go).
type adminUserDB interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type AdminUserRepo struct {
	pool adminUserDB
}

func NewAdminUserRepo(pool *pgxpool.Pool) *AdminUserRepo {
	return &AdminUserRepo{pool: pool}
}

// adminUserColumns dan adminUserScanTargets harus selalu berurutan sama.
const adminUserColumns = `id, email, password_hash, full_name, role, is_active, last_login_at, created_at, updated_at,
		token_version, totp_secret_enc, totp_pending_enc, totp_enabled_at, totp_last_step`

func adminUserScanTargets(u *model.AdminUser) []any {
	return []any{
		&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role,
		&u.IsActive, &u.LastLoginAt, &u.CreatedAt, &u.UpdatedAt,
		&u.TokenVersion, &u.TOTPSecretEnc, &u.TOTPPendingEnc, &u.TOTPEnabledAt, &u.TOTPLastStep,
	}
}

func (r *AdminUserRepo) FindByEmail(ctx context.Context, email string) (*model.AdminUser, error) {
	query := `
		SELECT ` + adminUserColumns + `
		FROM public.admin_users
		WHERE email = $1
	`
	var u model.AdminUser
	err := r.pool.QueryRow(ctx, query, email).Scan(adminUserScanTargets(&u)...)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("finding admin by email: %w", err)
	}
	return &u, nil
}

func (r *AdminUserRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.AdminUser, error) {
	query := `
		SELECT ` + adminUserColumns + `
		FROM public.admin_users
		WHERE id = $1
	`
	var u model.AdminUser
	err := r.pool.QueryRow(ctx, query, id).Scan(adminUserScanTargets(&u)...)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("finding admin by id: %w", err)
	}
	return &u, nil
}

func (r *AdminUserRepo) FindAll(ctx context.Context, page, perPage int) ([]model.AdminUser, int, error) {
	offset := (page - 1) * perPage

	var total int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM public.admin_users").Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting admin users: %w", err)
	}

	query := `
		SELECT ` + adminUserColumns + `
		FROM public.admin_users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := r.pool.Query(ctx, query, perPage, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("listing admin users: %w", err)
	}
	defer rows.Close()

	var users []model.AdminUser
	for rows.Next() {
		var u model.AdminUser
		if err := rows.Scan(adminUserScanTargets(&u)...); err != nil {
			return nil, 0, fmt.Errorf("scanning admin user: %w", err)
		}
		users = append(users, u)
	}
	return users, total, rows.Err()
}

func (r *AdminUserRepo) Create(ctx context.Context, u *model.AdminUser) error {
	query := `
		INSERT INTO public.admin_users (email, password_hash, full_name, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	return r.pool.QueryRow(ctx, query, u.Email, u.PasswordHash, u.FullName, u.Role).
		Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
}

// Update menulis kolom yang bisa diubah lewat PUT /api/admin/users/:id, HANYA
// bila token_version baris masih u.TokenVersion (nilai saat baris dimuat).
// revoke=true menaikkan token_version di statement yang sama, jadi perubahan
// yang mencabut sesi (nonaktif, sandi, peran) dan kenaikan versinya tidak bisa
// diselipi. false = baris sudah berubah sejak dimuat (sesi dicabut, sandi,
// status, atau peran diganti) atau sudah tidak ada: tidak ada yang ditulis.
// Tanpa syarat ini, permintaan yang memuat baris sebelum penonaktifan dan
// menulis sesudahnya mengembalikan is_active, peran, dan hash sandi lama.
func (r *AdminUserRepo) Update(ctx context.Context, u *model.AdminUser, revoke bool) (bool, error) {
	query := `
		UPDATE public.admin_users
		SET email = $2, full_name = $3, role = $4, is_active = $5, password_hash = $6,
		    token_version = token_version + CASE WHEN $8::boolean THEN 1 ELSE 0 END,
		    updated_at = NOW()
		WHERE id = $1 AND token_version = $7
		RETURNING token_version, updated_at
	`
	err := r.pool.QueryRow(ctx, query, u.ID, u.Email, u.FullName, u.Role, u.IsActive, u.PasswordHash, u.TokenVersion, revoke).
		Scan(&u.TokenVersion, &u.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *AdminUserRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM public.admin_users WHERE id = $1", id)
	return err
}

func (r *AdminUserRepo) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		"UPDATE public.admin_users SET last_login_at = NOW() WHERE id = $1", id)
	return err
}

// ───────────────────────── Fase 0c: sesi & TOTP ─────────────────────────

// BumpTokenVersion menaikkan token_version, sehingga semua access/refresh token
// admin ini ditolak /auth/me dan /auth/refresh. Mengembalikan nilai baru.
// Admin yang tidak ada → pgx.ErrNoRows.
func (r *AdminUserRepo) BumpTokenVersion(ctx context.Context, id uuid.UUID) (int, error) {
	var v int
	err := r.pool.QueryRow(ctx,
		`UPDATE public.admin_users
		    SET token_version = token_version + 1, updated_at = NOW()
		  WHERE id = $1
		RETURNING token_version`, id).Scan(&v)
	return v, err
}

// SetTOTPPending menyimpan rahasia terenkripsi hasil /totp/setup. Hanya untuk
// admin yang TOTP-nya belum aktif; mengembalikan false bila tidak ada baris yang berubah.
func (r *AdminUserRepo) SetTOTPPending(ctx context.Context, id uuid.UUID, enc string) (bool, error) {
	tag, err := r.pool.Exec(ctx,
		`UPDATE public.admin_users
		    SET totp_pending_enc = $2, updated_at = NOW()
		  WHERE id = $1 AND totp_enabled_at IS NULL`, id, enc)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() == 1, nil
}

// EnableTOTP memindahkan rahasia tertunda menjadi rahasia aktif, mencatat
// langkah kode konfirmasi sebagai totp_last_step, dan menaikkan token_version.
// pendingEnc harus sama dengan yang diverifikasi pemanggil (menutup balapan
// dengan /totp/setup lain); false bila syarat itu tidak terpenuhi.
func (r *AdminUserRepo) EnableTOTP(ctx context.Context, id uuid.UUID, pendingEnc string, step int64) (bool, error) {
	tag, err := r.pool.Exec(ctx,
		`UPDATE public.admin_users
		    SET totp_secret_enc  = totp_pending_enc,
		        totp_pending_enc = NULL,
		        totp_enabled_at  = NOW(),
		        totp_last_step   = $3,
		        token_version    = token_version + 1,
		        updated_at       = NOW()
		  WHERE id = $1 AND totp_enabled_at IS NULL AND totp_pending_enc = $2`, id, pendingEnc, step)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() == 1, nil
}

// DisableTOTP menghapus semua kolom TOTP dan menaikkan token_version, hanya
// bila step lebih baru dari totp_last_step (kode yang sama tidak bisa dipakai
// dua kali). false = TOTP tidak aktif atau kode sudah terpakai.
func (r *AdminUserRepo) DisableTOTP(ctx context.Context, id uuid.UUID, step int64) (bool, error) {
	tag, err := r.pool.Exec(ctx,
		`UPDATE public.admin_users
		    SET totp_secret_enc  = NULL,
		        totp_pending_enc = NULL,
		        totp_enabled_at  = NULL,
		        totp_last_step   = NULL,
		        token_version    = token_version + 1,
		        updated_at       = NOW()
		  WHERE id = $1 AND totp_enabled_at IS NOT NULL
		    AND (totp_last_step IS NULL OR totp_last_step < $2)`, id, step)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() == 1, nil
}

// ConsumeTOTPStep mencatat step sebagai langkah terakhir yang diterima, secara
// atomik: dua permintaan dengan kode yang sama, hanya satu yang menang.
func (r *AdminUserRepo) ConsumeTOTPStep(ctx context.Context, id uuid.UUID, step int64) (bool, error) {
	tag, err := r.pool.Exec(ctx,
		`UPDATE public.admin_users
		    SET totp_last_step = $2
		  WHERE id = $1 AND totp_enabled_at IS NOT NULL
		    AND (totp_last_step IS NULL OR totp_last_step < $2)`, id, step)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() == 1, nil
}

// ResetTOTP menghapus semua kolom TOTP (aktif maupun tertunda) dan menaikkan
// token_version. Dipakai super admin lewat POST /api/admin/users/:id/totp/reset
// (perangkat hilang, atau authenticator dipasang orang lain). false = admin tidak ada.
func (r *AdminUserRepo) ResetTOTP(ctx context.Context, id uuid.UUID) (bool, error) {
	tag, err := r.pool.Exec(ctx,
		`UPDATE public.admin_users
		    SET totp_secret_enc  = NULL,
		        totp_pending_enc = NULL,
		        totp_enabled_at  = NULL,
		        totp_last_step   = NULL,
		        token_version    = token_version + 1,
		        updated_at       = NOW()
		  WHERE id = $1`, id)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() == 1, nil
}

// AnyTOTPEnabled: adakah admin (aktif atau tidak) yang TOTP-nya aktif. Selama
// belum ada, aturan "sesi kuat" untuk memberi peran super admin dan menyetel
// sandi super admin lain belum berlaku (masa transisi, lihat README).
func (r *AdminUserRepo) AnyTOTPEnabled(ctx context.Context) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS (
		    SELECT 1 FROM public.admin_users
		     WHERE totp_enabled_at IS NOT NULL AND totp_secret_enc IS NOT NULL)`).Scan(&exists)
	return exists, err
}
