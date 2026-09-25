package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

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

// ErrEmailTaken: email (tanpa peka huruf) sudah dipakai admin lain. Dipulangkan
// Create/Update bila indeks unik lower(btrim(email)) (migrasi 000016) atau
// UNIQUE(email) lama menolak tulisan.
var ErrEmailTaken = errors.New("email admin sudah dipakai")

// isEmailTaken: pelanggaran unik pada kolom email admin_users.
func isEmailTaken(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505" &&
		(pgErr.ConstraintName == "admin_users_email_key" || pgErr.ConstraintName == "admin_users_email_lower_key")
}

// FindByEmail mencari admin tanpa peka huruf dan spasi tepi. Selama indeks unik
// 000016 belum terpasang (data lama berisi email kembar setelah dinormalkan),
// bisa ada lebih dari satu baris: yang persis sama dengan masukan didahulukan,
// lalu yang tertua, supaya perilaku login lama tidak berubah untuk akun itu.
func (r *AdminUserRepo) FindByEmail(ctx context.Context, email string) (*model.AdminUser, error) {
	query := `
		SELECT ` + adminUserColumns + `
		FROM public.admin_users
		WHERE lower(btrim(email)) = lower(btrim($1::text))
		ORDER BY (email = $1::text) DESC, created_at
		LIMIT 1
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
	err := r.pool.QueryRow(ctx, query, u.Email, u.PasswordHash, u.FullName, u.Role).
		Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
	if isEmailTaken(err) {
		return ErrEmailTaken
	}
	return err
}

// Update menulis kolom yang bisa diubah lewat PUT /api/admin/users/:id, HANYA
// bila token_version baris masih u.TokenVersion (nilai saat baris dimuat).
// revoke=true menaikkan token_version di statement yang sama, jadi perubahan
// yang mencabut sesi (nonaktif, sandi, peran) dan kenaikan versinya tidak bisa
// diselipi. false = baris sudah berubah sejak dimuat (sesi dicabut, sandi,
// status, atau peran diganti) atau sudah tidak ada: tidak ada yang ditulis.
// Tanpa syarat ini, permintaan yang memuat baris sebelum penonaktifan dan
// menulis sesudahnya mengembalikan is_active, peran, dan hash sandi lama.
// Email yang sudah dipakai admin lain → ErrEmailTaken.
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
	if isEmailTaken(err) {
		return false, ErrEmailTaken
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

// DuplicateEmailGroups: berapa email yang, setelah dinormalkan, dipakai lebih
// dari satu admin. Bukan nol = migrasi 000016 tidak bisa memasang indeks unik
// lower(btrim(email)); gateway mencatatnya di log saat start (lihat README).
func (r *AdminUserRepo) DuplicateEmailGroups(ctx context.Context) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT count(*) FROM (
		    SELECT 1 FROM public.admin_users
		     GROUP BY lower(btrim(email)) HAVING count(*) > 1) d`).Scan(&n)
	return n, err
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

// ───────────────────────── lapis panjang jatah faktor kedua ─────────────────────────
//
// Penghitung kegagalan faktor kedua jangka panjang (lapis "20 per 30 hari" di
// auth.RedisTOTPLimiter) disimpan di admin_users (migrasi 000017), bukan di
// Redis: Redis produksi memakai allkeys-lru, dan kunci di sana bisa dibuang
// eviction yang dipicu banjir /login tanpa autentikasi. Jendelanya tetap,
// dimulai dari kegagalan pertama (totp_gagal_panjang_mulai); jendela yang sudah
// lewat dibaca nol. Setiap perubahan adalah satu UPDATE bersyarat, jadi atomik
// terhadap permintaan paralel (kunci baris). AdminUserRepo memenuhi
// auth.LongAttemptStore. Kolom ini tidak ikut adminUserColumns: tidak pernah
// dipakai di luar pembatas.

// totpLongExpired: jendela panjang baris ini sudah lewat (atau belum dimulai).
// Parameter jendela selalu $2 (milidetik) di kueri yang memakainya.
const totpLongExpired = `(totp_gagal_panjang_mulai IS NULL
		   OR totp_gagal_panjang_mulai + $2::bigint * interval '1 millisecond' <= now())`

// totpLongRemainingMs: sisa jendela panjang (milidetik, bisa negatif bila lewat).
const totpLongRemainingMs = `COALESCE(floor(extract(epoch FROM
		   (totp_gagal_panjang_mulai + $2::bigint * interval '1 millisecond' - now())) * 1000)::bigint, 0)`

// LongFailures: kegagalan yang terhitung di jendela panjang saat ini (0 bila
// jendelanya lewat) dan sisa jendelanya. Admin tidak ada = galat (pemanggil
// gagal tertutup).
func (r *AdminUserRepo) LongFailures(ctx context.Context, id uuid.UUID, window time.Duration) (int64, time.Duration, error) {
	var n, ms int64
	err := r.pool.QueryRow(ctx,
		`SELECT CASE WHEN `+totpLongExpired+` THEN 0 ELSE totp_gagal_panjang END,
		        CASE WHEN `+totpLongExpired+` THEN 0 ELSE `+totpLongRemainingMs+` END
		   FROM public.admin_users WHERE id = $1`, id, window.Milliseconds()).Scan(&n, &ms)
	if err != nil {
		return 0, 0, fmt.Errorf("membaca kegagalan faktor kedua jangka panjang: %w", err)
	}
	return n, time.Duration(ms) * time.Millisecond, nil
}

// ReserveLongFailure memesan satu jatah jangka panjang bila hitungannya masih
// di bawah max (jendela yang lewat dimulai ulang dari 1). reserved=false = jatah
// habis (terkunci) atau admin tidak ada; tidak ada yang ditulis. n dan retry
// hanya berarti bila reserved.
func (r *AdminUserRepo) ReserveLongFailure(ctx context.Context, id uuid.UUID, max int64, window time.Duration) (bool, int64, time.Duration, error) {
	var n, ms int64
	err := r.pool.QueryRow(ctx,
		`UPDATE public.admin_users
		    SET totp_gagal_panjang       = CASE WHEN `+totpLongExpired+` THEN 1 ELSE totp_gagal_panjang + 1 END,
		        totp_gagal_panjang_mulai = CASE WHEN `+totpLongExpired+` THEN now() ELSE totp_gagal_panjang_mulai END
		  WHERE id = $1 AND (`+totpLongExpired+` OR totp_gagal_panjang < $3::int)
		RETURNING totp_gagal_panjang, `+totpLongRemainingMs,
		id, window.Milliseconds(), max).Scan(&n, &ms)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, 0, 0, nil
	}
	if err != nil {
		return false, 0, 0, fmt.Errorf("memesan jatah faktor kedua jangka panjang: %w", err)
	}
	return true, n, time.Duration(ms) * time.Millisecond, nil
}

// ReleaseLongFailure mengembalikan tepat satu jatah jangka panjang (percobaan
// yang berhasil, atau yang gagal karena galat server). Tidak pernah negatif;
// hitungan nol mengosongkan awal jendela, jadi kegagalan berikutnya memulai
// jendela baru (sama dengan DEL kunci Redis lama).
func (r *AdminUserRepo) ReleaseLongFailure(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE public.admin_users
		    SET totp_gagal_panjang       = totp_gagal_panjang - 1,
		        totp_gagal_panjang_mulai = CASE WHEN totp_gagal_panjang <= 1 THEN NULL ELSE totp_gagal_panjang_mulai END
		  WHERE id = $1 AND totp_gagal_panjang > 0`, id)
	return err
}

// ClearLongFailures membuka kunci jangka panjang (reset TOTP atau ganti sandi
// oleh super admin).
func (r *AdminUserRepo) ClearLongFailures(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE public.admin_users
		    SET totp_gagal_panjang = 0, totp_gagal_panjang_mulai = NULL
		  WHERE id = $1`, id)
	return err
}

// ImportLongFailures memindahkan hitungan jangka panjang lama dari Redis
// (sebelum 000017) ke sini: hitungan terbesar yang menang, dan jendela yang
// lewat dimulai ulang dengan sisa waktu kunci Redis itu. Sementara, sampai
// kunci Redis lama habis TTL-nya (30 hari sejak rilis).
func (r *AdminUserRepo) ImportLongFailures(ctx context.Context, id uuid.UUID, n int64, remaining, window time.Duration) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE public.admin_users
		    SET totp_gagal_panjang       = CASE WHEN `+totpLongExpired+` THEN $3::int
		                                        ELSE GREATEST(totp_gagal_panjang, $3::int) END,
		        totp_gagal_panjang_mulai = CASE WHEN `+totpLongExpired+`
		                                        THEN now() - ($2::bigint - $4::bigint) * interval '1 millisecond'
		                                        ELSE totp_gagal_panjang_mulai END
		  WHERE id = $1`, id, window.Milliseconds(), n, remaining.Milliseconds())
	return err
}
