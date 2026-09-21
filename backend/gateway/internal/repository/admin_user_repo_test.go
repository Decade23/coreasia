package repository

import (
	"context"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Uji SQL AdminUserRepo (Fase 0c) terhadap Postgres sungguhan yang sudah
// dimigrasi. Opt-in lewat GATEWAY_TEST_DATABASE_URL. Sengaja TIDAK menulis apa
// pun: semua perintah pengubah diarahkan ke id acak yang tidak ada, sehingga
// yang teruji adalah sintaks, tipe parameter, dan kolom — bukan data.
func TestAdminUserRepo_SQLFase0c(t *testing.T) {
	dsn := os.Getenv("GATEWAY_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("GATEWAY_TEST_DATABASE_URL tidak di-set")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	r := NewAdminUserRepo(pool)

	// Pemindaian kolom baru pada baris yang ada (baca saja; isi tidak dicetak).
	users, _, err := r.FindAll(ctx, 1, 50)
	if err != nil {
		t.Fatalf("FindAll dengan kolom baru: %v", err)
	}
	for _, u := range users {
		if u.TokenVersion < 0 {
			t.Fatalf("token_version negatif untuk %s", u.ID)
		}
		got, err := r.FindByID(ctx, u.ID)
		if err != nil || got == nil || got.TokenVersion != u.TokenVersion {
			t.Fatalf("FindByID: %v", err)
		}
	}
	if u, err := r.FindByEmail(ctx, "tidak-ada-"+uuid.NewString()+"@contoh.invalid"); err != nil || u != nil {
		t.Fatalf("FindByEmail tak ada: %v %v", u, err)
	}

	ghost := uuid.New()
	if _, err := r.BumpTokenVersion(ctx, ghost); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("BumpTokenVersion id tak ada: err = %v, want ErrNoRows", err)
	}
	if ok, err := r.SetTOTPPending(ctx, ghost, "v1:x"); err != nil || ok {
		t.Fatalf("SetTOTPPending: %v %v", ok, err)
	}
	if ok, err := r.EnableTOTP(ctx, ghost, "v1:x", 1); err != nil || ok {
		t.Fatalf("EnableTOTP: %v %v", ok, err)
	}
	if ok, err := r.DisableTOTP(ctx, ghost, 1); err != nil || ok {
		t.Fatalf("DisableTOTP: %v %v", ok, err)
	}
	if ok, err := r.ConsumeTOTPStep(ctx, ghost, 1); err != nil || ok {
		t.Fatalf("ConsumeTOTPStep: %v %v", ok, err)
	}
	if ok, err := r.ResetTOTP(ctx, ghost); err != nil || ok {
		t.Fatalf("ResetTOTP: %v %v", ok, err)
	}
	if ok, err := r.Update(ctx, &model.AdminUser{ID: ghost, Email: "hantu@contoh.invalid", FullName: "Hantu", Role: "admin"}, true); err != nil || ok {
		t.Fatalf("Update id tak ada: %v %v", ok, err)
	}

	// Putaran 3: pemicu aturan "sesi kuat" (baca saja), harus sejalan dengan
	// TOTPEnabled() pada baris yang terbaca.
	anyTOTP, err := r.AnyTOTPEnabled(ctx)
	if err != nil {
		t.Fatalf("AnyTOTPEnabled: %v", err)
	}
	if all, total, err := r.FindAll(ctx, 1, 1000); err == nil && total <= len(all) {
		want := false
		for _, u := range all {
			want = want || u.TOTPEnabled()
		}
		if anyTOTP != want {
			t.Fatalf("AnyTOTPEnabled = %v, baris ber-TOTP = %v", anyTOTP, want)
		}
	}
}

// Semantik SQL yang menjadi tumpuan keamanan Fase 0c (kenaikan token_version
// saat enable/disable/reset, predikat anti-replay yang atomik) diuji terhadap
// baris admin yang SUDAH ada, di dalam satu transaksi yang SELALU di-ROLLBACK:
// tidak ada akun yang dibuat dan tidak ada perubahan yang tersimpan. Opt-in
// lewat GATEWAY_TEST_DATABASE_URL.
func TestAdminUserRepo_SemantikTOTPDalamRollback(t *testing.T) {
	dsn := os.Getenv("GATEWAY_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("GATEWAY_TEST_DATABASE_URL tidak di-set")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	var id uuid.UUID
	if err := pool.QueryRow(ctx, `SELECT id FROM public.admin_users ORDER BY created_at LIMIT 1`).Scan(&id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			t.Skip("tidak ada baris admin_users untuk diuji (uji ini tidak membuat akun)")
		}
		t.Fatal(err)
	}
	before, err := NewAdminUserRepo(pool).FindByID(ctx, id)
	if err != nil || before == nil {
		t.Fatalf("FindByID: %v", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	// Tidak pernah Commit. Rollback juga terjadi bila uji gagal di tengah jalan.
	defer func() {
		if err := tx.Rollback(context.Background()); err != nil {
			t.Errorf("rollback: %v", err)
		}
		after, err := NewAdminUserRepo(pool).FindByID(context.Background(), id)
		if err != nil || after == nil || after.TokenVersion != before.TokenVersion ||
			(after.TOTPEnabledAt == nil) != (before.TOTPEnabledAt == nil) {
			t.Errorf("baris admin berubah setelah rollback: sebelum tv=%d, sesudah tv=%v (%v)", before.TokenVersion, func() any {
				if after == nil {
					return nil
				}
				return after.TokenVersion
			}(), err)
		}
	}()
	// Jangan menunggu lama bila baris sedang dikunci gateway yang berjalan.
	if _, err := tx.Exec(ctx, `SET LOCAL lock_timeout = '3s'; SET LOCAL statement_timeout = '10s'`); err != nil {
		t.Fatal(err)
	}
	r := &AdminUserRepo{pool: tx}
	// ringkas: hanya kolom yang diuji (tanpa hash sandi) untuk pesan galat.
	ringkas := func(u *model.AdminUser) string {
		if u == nil {
			return "<nil>"
		}
		return fmt.Sprintf("{tv:%d secret:%v pending:%v enabled_at:%v last_step:%v}",
			u.TokenVersion, u.TOTPSecretEnc != nil, u.TOTPPendingEnc != nil, u.TOTPEnabledAt != nil, u.TOTPLastStep)
	}
	get := func() *model.AdminUser {
		t.Helper()
		u, err := r.FindByID(ctx, id)
		if err != nil || u == nil {
			t.Fatalf("FindByID dalam transaksi: %v", err)
		}
		return u
	}
	must := func(what string, ok bool, err error, want bool) {
		t.Helper()
		if err != nil || ok != want {
			t.Fatalf("%s = %v (err %v), want %v", what, ok, err, want)
		}
	}

	// Titik awal yang bersih, apa pun keadaan TOTP baris ini: ResetTOTP.
	tv := get().TokenVersion
	ok, err := r.ResetTOTP(ctx, id)
	must("ResetTOTP", ok, err, true)
	u := get()
	if u.TokenVersion != tv+1 || u.TOTPSecretEnc != nil || u.TOTPPendingEnc != nil || u.TOTPEnabledAt != nil || u.TOTPLastStep != nil {
		t.Fatalf("ResetTOTP harus mengosongkan TOTP dan menaikkan tv: %s", ringkas(u))
	}
	tv = u.TokenVersion

	// setup → enable.
	ok, err = r.SetTOTPPending(ctx, id, "v1:uji-a")
	must("SetTOTPPending", ok, err, true)
	ok, err = r.EnableTOTP(ctx, id, "v1:uji-lain", 100)
	must("EnableTOTP dengan rahasia tertunda yang berbeda", ok, err, false)
	ok, err = r.EnableTOTP(ctx, id, "v1:uji-a", 100)
	must("EnableTOTP", ok, err, true)
	u = get()
	if u.TokenVersion != tv+1 {
		t.Fatalf("EnableTOTP harus menaikkan token_version: %d → %d", tv, u.TokenVersion)
	}
	if !u.TOTPEnabled() || *u.TOTPSecretEnc != "v1:uji-a" || u.TOTPPendingEnc != nil || u.TOTPLastStep == nil || *u.TOTPLastStep != 100 {
		t.Fatalf("keadaan setelah EnableTOTP: %s", ringkas(u))
	}
	tv = u.TokenVersion
	ok, err = r.EnableTOTP(ctx, id, "v1:uji-a", 101)
	must("EnableTOTP kedua kali", ok, err, false)
	ok, err = r.SetTOTPPending(ctx, id, "v1:uji-b")
	must("SetTOTPPending saat aktif", ok, err, false)

	// Anti-replay: langkah yang sama atau lebih lama ditolak, secara atomik.
	ok, err = r.ConsumeTOTPStep(ctx, id, 100)
	must("ConsumeTOTPStep langkah sama", ok, err, false)
	ok, err = r.ConsumeTOTPStep(ctx, id, 99)
	must("ConsumeTOTPStep langkah lama", ok, err, false)
	ok, err = r.ConsumeTOTPStep(ctx, id, 101)
	must("ConsumeTOTPStep langkah baru", ok, err, true)
	ok, err = r.ConsumeTOTPStep(ctx, id, 101)
	must("ConsumeTOTPStep langkah baru dua kali", ok, err, false)
	if u = get(); *u.TOTPLastStep != 101 || u.TokenVersion != tv {
		t.Fatalf("ConsumeTOTPStep: last_step=%v tv=%d (tv tidak boleh berubah)", u.TOTPLastStep, u.TokenVersion)
	}

	// disable: kode yang sudah terpakai ditolak; berhasil = semua kolom kosong + tv naik.
	ok, err = r.DisableTOTP(ctx, id, 101)
	must("DisableTOTP langkah terpakai", ok, err, false)
	ok, err = r.DisableTOTP(ctx, id, 100)
	must("DisableTOTP langkah lama", ok, err, false)
	ok, err = r.DisableTOTP(ctx, id, 102)
	must("DisableTOTP", ok, err, true)
	u = get()
	if u.TokenVersion != tv+1 || u.TOTPSecretEnc != nil || u.TOTPPendingEnc != nil || u.TOTPEnabledAt != nil || u.TOTPLastStep != nil {
		t.Fatalf("DisableTOTP harus mengosongkan TOTP dan menaikkan tv: %s", ringkas(u))
	}
	ok, err = r.DisableTOTP(ctx, id, 103)
	must("DisableTOTP saat mati", ok, err, false)
	ok, err = r.ConsumeTOTPStep(ctx, id, 200)
	must("ConsumeTOTPStep saat mati", ok, err, false)

	if v, err := r.BumpTokenVersion(ctx, id); err != nil || v != u.TokenVersion+1 {
		t.Fatalf("BumpTokenVersion = %d, %v; want %d", v, err, u.TokenVersion+1)
	}

	// Update (PUT /users/:id): hanya bila token_version masih sama dengan saat
	// baris dimuat; revoke menaikkan token_version di statement yang sama.
	// Kolom ditulis ulang dengan nilai yang sama (dan transaksi di-ROLLBACK).
	cur := get()
	stale := *cur
	stale.TokenVersion = cur.TokenVersion - 1
	ok, err = r.Update(ctx, &stale, false)
	must("Update dengan token_version basi", ok, err, false)
	same := *cur
	ok, err = r.Update(ctx, &same, false)
	must("Update tanpa revoke", ok, err, true)
	if got := get().TokenVersion; same.TokenVersion != cur.TokenVersion || got != cur.TokenVersion {
		t.Fatalf("Update tanpa revoke mengubah tv: %d → %d/%d", cur.TokenVersion, same.TokenVersion, got)
	}
	ok, err = r.Update(ctx, &same, true)
	must("Update dengan revoke", ok, err, true)
	if got := get().TokenVersion; same.TokenVersion != cur.TokenVersion+1 || got != cur.TokenVersion+1 {
		t.Fatalf("Update dengan revoke: tv %d → %d/%d, want +1", cur.TokenVersion, same.TokenVersion, got)
	}
	lama := *cur // dimuat sebelum revoke di atas: kini basi
	ok, err = r.Update(ctx, &lama, false)
	must("Update dari baris yang dimuat sebelum revoke", ok, err, false)
	if ok, err := r.ResetTOTP(ctx, uuid.New()); err != nil || ok {
		t.Fatalf("ResetTOTP id tak ada: %v %v", ok, err)
	}
}
