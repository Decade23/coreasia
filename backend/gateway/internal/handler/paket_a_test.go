package handler

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/config"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/google/uuid"
)

// Uji paket A (review console 24 Sep): validasi Update (F2), email admin tanpa
// peka huruf + ganti email mencabut sesi (F3), /me memulangkan id (kontrak
// CashFlow admin_gw_id), galat server tidak memakan jatah TOTP (F21), rakitan
// pembatas per IP di NewServer (F14), dan sesi hidup di /api-keys (F15).

// ───────────────────────── F2: validasi PUT /users/:id ─────────────────────────

// PUT /users/:id memakai aturan isian yang sama dengan POST /users: sandi lemah,
// peran di luar oneof, email tidak sah, dan nama kosong ditolak 400 tanpa
// menulis apa pun (dulu 200 dan tersimpan).
func TestUpdateAdmin_ValidasiSamaDenganCreate(t *testing.T) {
	e := newAuthEnv(t)
	boss := e.addAdmin(t, "boss@coreasia.id", "super_admin")
	target := e.addAdmin(t, "staf@coreasia.id", "admin")
	tok := e.tokens(t, boss, true).AccessToken
	path := "/api/admin/users/" + target.ID.String()
	before := e.store.get(target.ID)

	for _, body := range []map[string]any{
		{"password": "a"},
		{"password": "123456"},
		{"password": "semuakecil1"},
		{"role": "SUPER"},
		{"role": ""},
		{"email": "bukan-email"},
		{"full_name": ""},
		{"full_name": "A"},
	} {
		r := e.do(t, http.MethodPut, path, tok, body)
		if r.status != http.StatusBadRequest || r.errCode() != "VALIDATION_FAILED" {
			t.Fatalf("PUT %v: %d %s, want 400 VALIDATION_FAILED", body, r.status, r.errCode())
		}
	}
	after := e.store.get(target.ID)
	if after.PasswordHash != before.PasswordHash || after.Role != before.Role || after.Email != before.Email ||
		after.FullName != before.FullName || after.TokenVersion != before.TokenVersion {
		t.Fatalf("permintaan yang ditolak tidak boleh menulis: %+v", after)
	}
	// Isian sah tetap diterima.
	if r := e.do(t, http.MethodPut, path, tok, map[string]any{"full_name": "Staf Baru", "role": "admin", "password": "SandiKuat-123"}); r.status != http.StatusOK {
		t.Fatalf("isian sah: %d %v", r.status, r.body)
	}
}

// ───────────────────────── F3: email tanpa peka huruf ─────────────────────────

// Email admin lain (beda huruf besar atau spasi tepi) ditolak 409 seperti di
// Create; ganti email menyimpan bentuk baku dan mencabut sesi pemiliknya.
func TestUpdateAdmin_EmailTanpaPekaHurufDanMencabutSesi(t *testing.T) {
	e := newAuthEnv(t)
	boss := e.addAdmin(t, "boss@coreasia.id", "super_admin")
	target := e.addAdmin(t, "staf@coreasia.id", "admin")
	bossTok := e.tokens(t, boss, true).AccessToken
	targetTok := e.tokens(t, target, false).AccessToken
	path := "/api/admin/users/" + target.ID.String()

	for _, email := range []string{"boss@coreasia.id", "BOSS@COREASIA.ID", " Boss@CoreAsia.id "} {
		r := e.do(t, http.MethodPut, path, bossTok, map[string]any{"email": email})
		if r.status != http.StatusConflict || r.errCode() != "CONFLICT" {
			t.Fatalf("email %q milik admin lain: %d %s, want 409 CONFLICT", email, r.status, r.errCode())
		}
	}
	if got := e.store.get(target.ID); got.Email != "staf@coreasia.id" || got.TokenVersion != 0 {
		t.Fatalf("email kembar tidak boleh ditulis: %+v", got)
	}

	// Email sendiri dengan huruf berbeda: bukan penggantian, sesi tetap.
	if r := e.do(t, http.MethodPut, path, bossTok, map[string]any{"email": "STAF@coreasia.id", "full_name": "Staf"}); r.status != http.StatusOK {
		t.Fatalf("email sama beda huruf: %d %v", r.status, r.body)
	}
	if got := e.store.get(target.ID); got.Email != "staf@coreasia.id" || got.TokenVersion != 0 {
		t.Fatalf("email sama beda huruf tidak mencabut sesi: %+v", got)
	}

	// Ganti email: disimpan baku, token_version naik, token lama mati.
	r := e.do(t, http.MethodPut, path, bossTok, map[string]any{"email": "  Staf.Baru@CoreAsia.ID "})
	if r.status != http.StatusOK || r.data()["email"] != "staf.baru@coreasia.id" {
		t.Fatalf("ganti email: %d %v", r.status, r.body)
	}
	if got := e.store.get(target.ID); got.Email != "staf.baru@coreasia.id" || got.TokenVersion != 1 {
		t.Fatalf("ganti email harus disimpan baku dan mencabut sesi: %+v", got)
	}
	if r := e.do(t, http.MethodGet, "/api/admin/auth/me", targetTok, nil); r.status != http.StatusUnauthorized {
		t.Fatalf("token lama setelah ganti email: /me = %d, want 401", r.status)
	}
	d := e.audit.descsOf("update")
	if len(d) == 0 || !strings.Contains(d[len(d)-1], "email lama: staf@coreasia.id") || !strings.Contains(d[len(d)-1], "semua sesi dicabut") {
		t.Fatalf("audit ganti email harus menyebut email lama dan pencabutan: %q", d)
	}

	// Akun sendiri: ganti email juga mencabut sesi sendiri (tidak bisa
	// memperoleh identitas baru tanpa login ulang).
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+boss.ID.String(), bossTok, map[string]any{"email": "boss2@coreasia.id"}); r.status != http.StatusOK {
		t.Fatalf("ganti email sendiri: %d %v", r.status, r.body)
	}
	if r := e.do(t, http.MethodGet, "/api/admin/auth/me", bossTok, nil); r.status != http.StatusUnauthorized {
		t.Fatalf("token sendiri setelah ganti email: /me = %d, want 401", r.status)
	}
}

// Create menolak email yang sudah ada dengan huruf berbeda, menyimpan bentuk
// baku, dan login menerima email dengan huruf besar/spasi tepi.
func TestCreateDanLogin_EmailTanpaPekaHuruf(t *testing.T) {
	e := newAuthEnv(t)
	boss := e.addAdmin(t, "boss@coreasia.id", "super_admin")
	tok := e.tokens(t, boss, true).AccessToken
	body := func(email string) map[string]any {
		return map[string]any{"email": email, "password": "SandiKuat-123", "full_name": "Admin Baru", "role": "admin"}
	}
	for _, email := range []string{"BOSS@coreasia.id", " boss@coreasia.id "} {
		if r := e.do(t, http.MethodPost, "/api/admin/users", tok, body(email)); r.status != http.StatusConflict || r.errCode() != "CONFLICT" {
			t.Fatalf("Create %q: %d %s, want 409 CONFLICT", email, r.status, r.errCode())
		}
	}
	r := e.do(t, http.MethodPost, "/api/admin/users", tok, body(" Baru@CoreAsia.ID "))
	if r.status != http.StatusCreated || r.data()["email"] != "baru@coreasia.id" {
		t.Fatalf("Create email baru: %d %v", r.status, r.body)
	}
	if u, _ := e.store.FindByEmail(context.Background(), "baru@coreasia.id"); u == nil || u.Email != "baru@coreasia.id" {
		t.Fatalf("email harus disimpan baku: %+v", u)
	}
	if r := e.loginWith(t, "  BOSS@CoreAsia.ID ", authTestPassword); r.status != http.StatusOK {
		t.Fatalf("login email huruf besar + spasi: %d %v", r.status, r.body)
	}
}

// emailTakenStore meniru indeks unik 000016 yang menolak tulisan (balapan dua
// permintaan dengan email yang sama di antara pemeriksaan dan tulis).
type emailTakenStore struct{ *fakeAdminStore }

func (emailTakenStore) Update(context.Context, *model.AdminUser, bool) (bool, error) {
	return false, repository.ErrEmailTaken
}
func (emailTakenStore) Create(context.Context, *model.AdminUser) error {
	return repository.ErrEmailTaken
}

func TestAdmin_PelanggaranUnikDariDB409(t *testing.T) {
	e := newAuthEnvWith(t, envOpts{wrap: func(f *fakeAdminStore) adminUserStore { return emailTakenStore{f} }})
	boss := e.addAdmin(t, "boss@coreasia.id", "super_admin")
	target := e.addAdmin(t, "staf@coreasia.id", "admin")
	tok := e.tokens(t, boss, true).AccessToken
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+target.ID.String(), tok, map[string]any{"email": "lain@coreasia.id"}); r.status != http.StatusConflict {
		t.Fatalf("Update, DB menolak email: %d %v, want 409", r.status, r.body)
	}
	if r := e.do(t, http.MethodPost, "/api/admin/users", tok, map[string]any{"email": "lain@coreasia.id", "password": "SandiKuat-123", "full_name": "Lain", "role": "admin"}); r.status != http.StatusConflict {
		t.Fatalf("Create, DB menolak email: %d %v, want 409", r.status, r.body)
	}
}

// ───────────────────────── kontrak: /me memulangkan id ─────────────────────────

// Landing menulis data.id dari /me sebagai admin_konsol_sesi.admin_gw_id
// (CashFlow 0092): identitas admin yang tidak berubah saat email diganti.
func TestMe_MemulangkanIDAdmin(t *testing.T) {
	e := newAuthEnv(t)
	u := e.addAdmin(t, "a@coreasia.id", "super_admin")
	r := e.do(t, http.MethodGet, "/api/admin/auth/me", e.tokens(t, u, false).AccessToken, nil)
	if r.status != http.StatusOK {
		t.Fatalf("/me: %d", r.status)
	}
	id, _ := r.data()["id"].(string)
	if parsed, err := uuid.Parse(id); err != nil || parsed != u.ID {
		t.Fatalf("/me data.id = %q, want %s", id, u.ID)
	}
}

// ───────────────────────── F21: galat server tidak memakan jatah ─────────────────────────

// Setelah rotasi JWT_SECRET, rahasia TOTP tidak terbuka dan /totp/verify
// menjawab 500. Setiap percobaan itu dulu memakan jatah 30 hari tanpa audit;
// kini jatahnya kembali, ada baris totp_error, dan klien tidak menerima detail.
func TestTOTPVerify_GalatServerTidakMemakanJatah(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	other, _ := auth.NewTOTPCipher("secret-lama-sebelum-rotasi")
	enc, _ := other.Seal(u.ID, secret)
	e.store.users[u.ID].TOTPSecretEnc = &enc

	for i := 1; i <= totpMaxFailuresLong+5; i++ {
		r := e.verify(t, e.challenge(t, "mfa@coreasia.id"), e.code(t, secret))
		if r.status != http.StatusInternalServerError {
			t.Fatalf("percobaan ke-%d: %d %s, want 500 (bukan 429/423)", i, r.status, r.errCode())
		}
		if m := errMessage(r.body); strings.Contains(m, "JWT") || strings.Contains(m, "rahasia") || m != "Terjadi kesalahan internal" {
			t.Fatalf("pesan ke klien tidak boleh membawa detail: %q", m)
		}
	}
	if n, l := e.limiter.count(u.ID), e.limiter.longCount(u.ID); n != 0 || l != 0 {
		t.Fatalf("jatah setelah galat server: pendek %d, panjang %d, want 0/0", n, l)
	}
	if got := e.audit.count("totp_error"); got != totpMaxFailuresLong+5 {
		t.Fatalf("audit totp_error = %d, want %d", got, totpMaxFailuresLong+5)
	}
	if e.audit.has("totp_failed") || e.audit.has("totp_locked") {
		t.Fatal("galat server bukan kode salah: tanpa totp_failed/totp_locked")
	}
	d := e.audit.descsOf("totp_error")
	if !strings.Contains(d[0], "JWT_SECRET dirotasi") || !strings.Contains(d[0], "dikembalikan") {
		t.Fatalf("deskripsi totp_error: %q", d[0])
	}
}

// Kegagalan lama tetap terhitung: galat server hanya mengembalikan jatahnya
// sendiri, bukan mengosongkan jendela pendek.
func TestTOTPVerify_GalatServerHanyaJatahnyaSendiri(t *testing.T) {
	e := newAuthEnvWith(t, envOpts{wrap: func(f *fakeAdminStore) adminUserStore { return consumeErrStore{f} }})
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	ch := e.challenge(t, "mfa@coreasia.id")
	for i := 0; i < 2; i++ {
		if r := e.verify(t, ch, e.wrongCode(t, secret)); r.status != http.StatusUnauthorized {
			t.Fatalf("kode salah: %d", r.status)
		}
	}
	// Kode benar, tetapi DB gagal mencatat langkahnya: 500, jatah kembali.
	if r := e.verify(t, ch, e.code(t, secret)); r.status != http.StatusInternalServerError {
		t.Fatalf("DB gagal: %d, want 500", r.status)
	}
	if n, l := e.limiter.count(u.ID), e.limiter.longCount(u.ID); n != 2 || l != 2 {
		t.Fatalf("jatah: pendek %d, panjang %d, want 2/2", n, l)
	}
	if e.audit.count("totp_error") != 1 || e.audit.count("totp_failed") != 2 {
		t.Fatalf("audit: %v", e.audit.actions)
	}
}

type consumeErrStore struct{ *fakeAdminStore }

func (consumeErrStore) ConsumeTOTPStep(context.Context, uuid.UUID, int64) (bool, error) {
	return false, errors.New("koneksi DB putus")
}

// Jalur yang sama di disable dan enable.
func TestTOTPDisableEnable_GalatServerTidakMemakanJatah(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	other, _ := auth.NewTOTPCipher("secret-lama-sebelum-rotasi")
	enc, _ := other.Seal(u.ID, secret)
	e.store.users[u.ID].TOTPSecretEnc = &enc
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/disable", e.tokens(t, u, true).AccessToken, map[string]string{"code": e.code(t, secret)}); r.status != http.StatusInternalServerError {
		t.Fatalf("disable: %d", r.status)
	}
	if e.limiter.longCount(u.ID) != 0 || !e.audit.has("totp_error") {
		t.Fatalf("disable: jatah panjang %d, audit %v", e.limiter.longCount(u.ID), e.audit.actions)
	}

	fresh := e.addAdmin(t, "baru@coreasia.id", "admin")
	pending, _ := other.Seal(fresh.ID, secret)
	e.store.users[fresh.ID].TOTPPendingEnc = &pending
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/enable", e.tokens(t, fresh, false).AccessToken, map[string]string{"code": e.code(t, secret)}); r.status != http.StatusBadRequest {
		t.Fatalf("enable: %d", r.status)
	}
	if e.limiter.longCount(fresh.ID) != 0 || e.audit.count("totp_error") != 2 {
		t.Fatalf("enable: jatah panjang %d, audit %v", e.limiter.longCount(fresh.ID), e.audit.actions)
	}
}

// Hash sandi tersimpan rusak (bukan bcrypt) di /totp/setup dan ganti sandi
// sendiri: galat server, bukan sandi salah. Jatah kembali, tanpa totp_failed.
func TestSandiKonfirmasi_HashRusakTidakMemakanJatah(t *testing.T) {
	e := newAuthEnv(t)
	e.addTOTPAdmin(t, "master@coreasia.id") // aturan sandi saat ini berlaku
	u := e.addAdmin(t, "a@coreasia.id", "super_admin")
	e.store.users[u.ID].PasswordHash = "bukan-hash-bcrypt"
	tok := e.tokens(t, u, false).AccessToken
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/setup", tok, setupBody); r.status != http.StatusInternalServerError {
		t.Fatalf("setup, hash rusak: %d %v, want 500", r.status, r.body)
	}
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+u.ID.String(), tok, map[string]any{"password": "SandiBaru-999!", "current_password": "apa-saja"}); r.status != http.StatusInternalServerError {
		t.Fatalf("ganti sandi sendiri, hash rusak: %d %v, want 500", r.status, r.body)
	}
	if e.limiter.count(u.ID) != 0 || e.limiter.longCount(u.ID) != 0 {
		t.Fatalf("jatah: pendek %d, panjang %d, want 0/0", e.limiter.count(u.ID), e.limiter.longCount(u.ID))
	}
	if e.audit.has("totp_failed") || e.audit.count("totp_error") != 2 {
		t.Fatalf("audit: %v", e.audit.actions)
	}
}

// ───────────────────────── F14: rakitan pembatas di NewServer ─────────────────────────

// postXFF: POST {} ke server sungguhan dengan X-Forwarded-For yang entri
// kirinya (karangan klien) berbeda di setiap permintaan, di belakang
// Cloudflare (162.158.0.0/15) dari klien asli 203.0.113.7.
func postXFF(t *testing.T, base, path string, i int) int {
	t.Helper()
	req, _ := http.NewRequest(http.MethodPost, base+path, strings.NewReader("{}"))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Forwarded-For", fmt.Sprintf("10.%d.%d.%d, 203.0.113.7, 162.158.1.1", i%250, (i/250)%250, i%7))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	return resp.StatusCode
}

// Rakitan produksi (NewServer): pembatas per IP /login (5 per 15 menit) dan
// /totp/verify (10 per 15 menit) dikunci mw.ClientIPKey, jadi XFF kiri acak
// tetap kena 429; dan pembatas hanya mati bila APP_ENV=development di-set
// EKSPLISIT, bukan dari cfg.App.Env (nilai config.yaml di image).
func TestServer_PembatasIPAuthAdmin_KunciClientIP(t *testing.T) {
	statuses := func(t *testing.T, cfgEnv, path string, n int) []int {
		cfg := &config.Config{}
		cfg.App.Env = cfgEnv
		cfg.JWT.Secret = auth.RandomJWTSecret()
		cfg.JWT.Issuer = "coreasia-gateway"
		base := serveEnv(t, NewServer(cfg, nil, nil).App())
		out := make([]int, n)
		for i := range out {
			out[i] = postXFF(t, base, path, i)
		}
		return out
	}
	expect := func(t *testing.T, what string, got []int, limit int) {
		t.Helper()
		for i, s := range got {
			want := http.StatusBadRequest // body {} gagal validasi, sesudah pembatas
			if limit > 0 && i >= limit {
				want = http.StatusTooManyRequests
			}
			if s != want {
				t.Fatalf("%s: permintaan ke-%d = %d, want %d (semua: %v)", what, i+1, s, want, got)
			}
		}
	}

	t.Run("produksi", func(t *testing.T) {
		t.Setenv("APP_ENV", "production")
		expect(t, "/login", statuses(t, "production", "/api/admin/auth/login", 8), 5)
		expect(t, "/totp/verify", statuses(t, "production", "/api/admin/auth/totp/verify", 13), 10)
	})
	t.Run("APP_ENV tidak di-set, config development", func(t *testing.T) {
		unsetAppEnv(t)
		expect(t, "/login", statuses(t, "development", "/api/admin/auth/login", 8), 5)
		expect(t, "/totp/verify", statuses(t, "development", "/api/admin/auth/totp/verify", 13), 10)
	})
	t.Run("APP_ENV=development eksplisit", func(t *testing.T) {
		t.Setenv("APP_ENV", "development")
		expect(t, "/login", statuses(t, "development", "/api/admin/auth/login", 8), 0)
	})
}

// ───────────────────────── F15: sesi hidup di /api-keys ─────────────────────────

// Token super admin yang sudah dicabut (token_version naik) ditolak 401 di
// SEMUA rute /api/admin/api-keys/** sebelum handler terpanggil: tidak bisa
// menyalin kunci provider atau membuat kunci baru selama sisa umurnya.
func TestAPIKeys_TokenDicabutDitolak(t *testing.T) {
	e := newAuthEnv(t)
	boss := e.addAdmin(t, "boss@coreasia.id", "super_admin")
	tok := e.tokens(t, boss, true).AccessToken
	id := uuid.NewString()
	routes := []struct{ method, path string }{
		{http.MethodGet, "/api/admin/api-keys"},
		{http.MethodGet, "/api/admin/api-keys/" + id},
		{http.MethodGet, "/api/admin/api-keys/" + id + "/copy"},
		{http.MethodPost, "/api/admin/api-keys"},
		{http.MethodPut, "/api/admin/api-keys/" + id},
		{http.MethodDelete, "/api/admin/api-keys/" + id},
	}
	for _, rt := range routes {
		if r := e.do(t, rt.method, rt.path, tok, map[string]any{}); r.status != http.StatusOK {
			t.Fatalf("sesi hidup %s %s: %d, want 200", rt.method, rt.path, r.status)
		}
	}
	if e.keys.calls.Load() != int64(len(routes)) {
		t.Fatalf("handler terpanggil %d kali, want %d", e.keys.calls.Load(), len(routes))
	}

	_, _ = e.store.BumpTokenVersion(context.Background(), boss.ID) // logout-all / revoke-sessions
	e.keys.calls.Store(0)
	for _, rt := range routes {
		if r := e.do(t, rt.method, rt.path, tok, map[string]any{}); r.status != http.StatusUnauthorized {
			t.Fatalf("token dicabut %s %s: %d, want 401", rt.method, rt.path, r.status)
		}
	}
	if e.keys.calls.Load() != 0 {
		t.Fatalf("handler api-keys terpanggil %d kali dengan token yang dicabut", e.keys.calls.Load())
	}
}
