package repository

import (
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/google/uuid"
)

func TestTrustedDevicesSQL(t *testing.T) {
	pool, ctx := testPool(t)
	tx := rollbackTx(t, pool, ctx)
	users := &AdminUserRepo{pool: tx}
	devices := &TrustedDeviceRepo{pool: tx}
	u := newTestAdmin(t, users, ctx, "trust-"+uuid.NewString()+"@contoh.invalid")
	if _, err := tx.Exec(ctx, `UPDATE public.admin_users SET totp_enabled_at=now(),totp_secret_enc='uji' WHERE id=$1`, u.ID); err != nil {
		t.Fatal(err)
	}
	now := time.Now().UTC().Truncate(time.Microsecond)
	d := auth.TrustedDevice{ID: uuid.New(), AdminID: u.ID, TokenVersion: u.TokenVersion, Name: "Chrome di Mac", CreatedAt: now, LastUsedAt: now, ExpiresAt: now.Add(auth.TrustedDeviceTTL)}
	if ok, err := devices.Create(ctx, &d); err != nil || !ok {
		t.Fatalf("create %v %v", ok, err)
	}
	if until, err := devices.ActiveUntil(ctx, d.ID, u.ID, u.TokenVersion, now); err != nil || !until.Equal(d.ExpiresAt) {
		t.Fatalf("active %v %v", until, err)
	}
	if until, err := devices.ActiveUntil(ctx, d.ID, uuid.New(), u.TokenVersion, now); err != nil || !until.IsZero() {
		t.Fatal("owner lain diterima", err)
	}
	if ok, _ := devices.Revoke(ctx, d.ID, uuid.New(), now); ok {
		t.Fatal("owner lain mencabut perangkat")
	}
	later := now.Add(6 * 24 * time.Hour)
	if ok, err := devices.Renew(ctx, d.ID, u.ID, u.TokenVersion, later, later.Add(auth.TrustedDeviceTTL)); err != nil || !ok {
		t.Fatalf("renew %v %v", ok, err)
	}
	list, err := devices.List(ctx, u.ID, u.TokenVersion, later)
	if err != nil || len(list) != 1 || !list[0].ExpiresAt.Equal(later.Add(auth.TrustedDeviceTTL)) {
		t.Fatalf("list/renew: %v %v", list, err)
	}
	// Expiry tepat batas tidak bisa dihidupkan kembali.
	boundary := later.Add(auth.TrustedDeviceTTL)
	if ok, _ := devices.Renew(ctx, d.ID, u.ID, u.TokenVersion, boundary, boundary.Add(auth.TrustedDeviceTTL)); ok {
		t.Fatal("perangkat kedaluwarsa hidup lagi")
	}
	if ok, err := devices.Revoke(ctx, d.ID, u.ID, later); err != nil || !ok {
		t.Fatalf("revoke %v %v", ok, err)
	}
	if ok, _ := devices.Renew(ctx, d.ID, u.ID, u.TokenVersion, later, later.Add(auth.TrustedDeviceTTL)); ok {
		t.Fatal("perangkat dicabut hidup lagi")
	}
	// Perubahan kredensial/token_version harus mengalahkan enrollment lama.
	if _, err := users.BumpTokenVersion(ctx, u.ID); err != nil {
		t.Fatal(err)
	}
	d.ID = uuid.New()
	if ok, err := devices.Create(ctx, &d); err != nil || ok {
		t.Fatalf("enroll versi lama: %v %v", ok, err)
	}
}
