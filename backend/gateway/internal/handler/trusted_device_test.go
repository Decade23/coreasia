package handler

import (
	"context"
	"net/http"
	"sync"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/google/uuid"
)

type fakeDevices struct {
	mu      sync.Mutex
	rows    map[uuid.UUID]auth.TrustedDevice
	revoked map[uuid.UUID]bool
}

func newFakeDevices() *fakeDevices {
	return &fakeDevices{rows: map[uuid.UUID]auth.TrustedDevice{}, revoked: map[uuid.UUID]bool{}}
}
func (d *fakeDevices) Create(_ context.Context, p *auth.TrustedDevice) (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.rows[p.ID] = *p
	return true, nil
}
func (d *fakeDevices) active(id, owner uuid.UUID, tv int, now time.Time) bool {
	p, ok := d.rows[id]
	return ok && !d.revoked[id] && p.AdminID == owner && p.TokenVersion == tv && p.ExpiresAt.After(now)
}
func (d *fakeDevices) ActiveUntil(_ context.Context, id, owner uuid.UUID, tv int, now time.Time) (time.Time, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	if !d.active(id, owner, tv, now) {
		return time.Time{}, nil
	}
	return d.rows[id].ExpiresAt, nil
}
func (d *fakeDevices) Renew(_ context.Context, id, owner uuid.UUID, tv int, now, until time.Time) (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	if !d.active(id, owner, tv, now) {
		return false, nil
	}
	p := d.rows[id]
	p.LastUsedAt = now
	p.ExpiresAt = until
	d.rows[id] = p
	return true, nil
}
func (d *fakeDevices) List(_ context.Context, owner uuid.UUID, tv int, now time.Time) ([]auth.TrustedDevice, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	out := []auth.TrustedDevice{}
	for id, p := range d.rows {
		if d.active(id, owner, tv, now) {
			out = append(out, p)
		}
	}
	return out, nil
}
func (d *fakeDevices) Revoke(_ context.Context, id, owner uuid.UUID, _ time.Time) (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	p, ok := d.rows[id]
	if !ok || p.AdminID != owner || d.revoked[id] {
		return false, nil
	}
	d.revoked[id] = true
	return true, nil
}

func TestTrustedDevices_LoginRenewRevoke(t *testing.T) {
	devices := newFakeDevices()
	e := newAuthEnvWith(t, envOpts{devices: devices})
	u, secret := e.addTOTPAdmin(t, "trusted@contoh.invalid")
	ch := e.challenge(t, u.Email)
	r := e.do(t, http.MethodPost, "/api/admin/auth/totp/verify", "", map[string]any{"challenge": ch, "code": e.code(t, secret), "trust_device": true})
	if r.status != 200 {
		t.Fatalf("login: %d %v", r.status, r.body)
	}
	access := r.data()["access_token"].(string)
	refresh := r.data()["refresh_token"].(string)
	ac, _ := e.jwt.ValidateAccess(access)
	rc, _ := e.jwt.ValidateRefresh(refresh)
	if ac.DeviceID == "" || rc.DeviceID != ac.DeviceID || !ac.HasFreshMFA(time.Now()) {
		t.Fatal("bukti perangkat/MFA hilang")
	}
	if remaining := time.Until(rc.ExpiresAt.Time); remaining < auth.TrustedDeviceTTL-time.Minute || remaining > auth.TrustedDeviceTTL {
		t.Fatalf("umur refresh: %s", remaining)
	}
	id := uuid.MustParse(ac.DeviceID)
	list := e.do(t, http.MethodGet, "/api/admin/auth/devices", access, nil)
	if list.status != 200 {
		t.Fatalf("list: %d", list.status)
	}
	// Bukti TOTP sudah tua: login tetap hidup, izin sensitif tidak ikut segar.
	stale := time.Now().Add(-13 * time.Hour)
	oldPair, err := e.jwt.GenerateTrustedPair(u.ID, u.Email, u.Role, u.FullName, stale, u.TokenVersion, id)
	if err != nil {
		t.Fatal(err)
	}
	devices.mu.Lock()
	p := devices.rows[id]
	p.ExpiresAt = time.Now().Add(time.Hour)
	devices.rows[id] = p
	devices.mu.Unlock()
	renewed := e.refresh(t, oldPair.RefreshToken)
	if renewed.status != 200 {
		t.Fatalf("refresh: %d %v", renewed.status, renewed.body)
	}
	next, _ := e.jwt.ValidateAccess(renewed.data()["access_token"].(string))
	if next.HasFreshMFA(time.Now()) || next.MFAAt != stale.Unix() {
		t.Fatal("refresh menyegarkan MFA tanpa TOTP")
	}
	if time.Until(devices.rows[id].ExpiresAt) < auth.TrustedDeviceTTL-time.Minute {
		t.Fatal("tidak diperpanjang 7 hari")
	}
	me := e.do(t, http.MethodGet, "/api/admin/auth/me", renewed.data()["access_token"].(string), nil)
	if me.status != 200 || me.data()["mfa"] != false || me.data()["mfa_at"] != nil {
		t.Fatalf("me stale: %v", me.body)
	}
	rawExpiry, _ := me.data()["trusted_device_expires_at"].(string)
	expiry, err := time.Parse(time.RFC3339Nano, rawExpiry)
	if err != nil || !expiry.Equal(devices.rows[id].ExpiresAt) || me.data()["trusted_device_id"] != id.String() {
		t.Fatalf("proof expired or not tied to the active device: %v", me.body)
	}
	// Admin lain tidak boleh melihat atau mencabutnya.
	other, _ := e.addTOTPAdmin(t, "other@contoh.invalid")
	otherPair := e.tokens(t, other, true)
	if r := e.do(t, http.MethodDelete, "/api/admin/auth/devices/"+id.String(), otherPair.AccessToken, nil); r.status != 404 {
		t.Fatalf("cabut milik lain: %d", r.status)
	}
	// Logout mengakhiri refresh DAN access, termasuk endpoint baca.
	if r := e.do(t, http.MethodPost, "/api/admin/auth/logout", access, nil); r.status != 204 {
		t.Fatalf("logout: %d", r.status)
	}
	if r := e.do(t, http.MethodGet, "/api/admin/auth/me", access, nil); r.status != 401 {
		t.Fatalf("akses sesudah logout: %d", r.status)
	}
	if r := e.refresh(t, refresh); r.status != 401 {
		t.Fatalf("refresh sesudah logout: %d", r.status)
	}
}

func TestTrustedDevices_ExpireAndGlobalRevoke(t *testing.T) {
	for _, action := range []string{"expire", "logout-all", "password"} {
		t.Run(action, func(t *testing.T) {
			devices := newFakeDevices()
			e := newAuthEnvWith(t, envOpts{devices: devices})
			u, _ := e.addTOTPAdmin(t, "expiry@contoh.invalid")
			id := uuid.New()
			now := time.Now()
			devices.rows[id] = auth.TrustedDevice{ID: id, AdminID: u.ID, TokenVersion: u.TokenVersion, CreatedAt: now, ExpiresAt: now.Add(auth.TrustedDeviceTTL)}
			pair, _ := e.jwt.GenerateTrustedPair(u.ID, u.Email, u.Role, u.FullName, now, u.TokenVersion, id)
			switch action {
			case "expire":
				p := devices.rows[id]
				p.ExpiresAt = now.Add(-time.Second)
				devices.rows[id] = p
			case "logout-all":
				r := e.do(t, "POST", "/api/admin/auth/logout-all", pair.AccessToken, nil)
				if r.status != 204 {
					t.Fatal(r.body)
				}
			case "password":
				_, _ = e.store.BumpTokenVersion(context.Background(), u.ID)
			}
			if r := e.refresh(t, pair.RefreshToken); r.status != 401 {
				t.Fatalf("sesi dicabut masih refresh: %d", r.status)
			}
			if r := e.do(t, "GET", "/api/admin/auth/me", pair.AccessToken, nil); r.status != 401 {
				t.Fatalf("sesi dicabut masih me: %d", r.status)
			}
		})
	}
}

func TestTrustedDevices_EnrollNeedsRecentTOTPAndStepUp(t *testing.T) {
	devices := newFakeDevices()
	e := newAuthEnvWith(t, envOpts{devices: devices})
	u, secret := e.addTOTPAdmin(t, "step@contoh.invalid")
	noMFA := e.tokens(t, u, false)
	if r := e.do(t, "POST", "/api/admin/auth/devices/enroll", noMFA.AccessToken, nil); r.status != 403 {
		t.Fatalf("enroll tanpa MFA: %d", r.status)
	}
	// Step-up dengan kode salah tidak mengakhiri sesi, kode benar memberi MFA.
	if r := e.do(t, "POST", "/api/admin/auth/totp/step-up", noMFA.AccessToken, map[string]string{"code": e.wrongCode(t, secret)}); r.status != 400 {
		t.Fatalf("kode salah: %d", r.status)
	}
	r := e.do(t, "POST", "/api/admin/auth/totp/step-up", noMFA.AccessToken, map[string]string{"code": e.code(t, secret)})
	if r.status != 200 {
		t.Fatalf("step up: %d %v", r.status, r.body)
	}
	fresh := r.data()["access_token"].(string)
	if r := e.do(t, "POST", "/api/admin/auth/totp/step-up", fresh, map[string]string{"code": e.code(t, secret)}); r.status != 400 {
		t.Fatalf("kode replay: %d", r.status)
	}
	enrolled := e.do(t, "POST", "/api/admin/auth/devices/enroll", fresh, nil)
	if enrolled.status != 200 {
		t.Fatalf("enroll baru: %d %v", enrolled.status, enrolled.body)
	}
	claims, _ := e.jwt.ValidateAccess(enrolled.data()["access_token"].(string))
	if claims.DeviceID == "" {
		t.Fatal("id perangkat kosong")
	}
}
