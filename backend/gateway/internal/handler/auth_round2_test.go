package handler

import (
	"context"
	"net/http"
	"os"
	"strconv"
	"testing"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// Uji pengerasan Fase 0c putaran 2: sesi mfa=true untuk mengelola admin
// ber-TOTP, dan batas percobaan sandi /login per akun.

// ───────────────────────── akun ber-TOTP butuh sesi ber-MFA ─────────────────────────

// Temuan: sesi mfa=false milik super admin tanpa TOTP bisa mereset TOTP
// Master, mengganti sandinya, lalu login sebagai Master dan mendaftarkan
// authenticator sendiri (sesi mfa=true atas nama Master). Rantai itu kini putus
// di langkah pertama, dan setiap jalan lain yang melucuti atau menguasai akun
// ber-TOTP juga tertutup.
func TestManajemenAdmin_TargetBerTOTPButuhSesiMFA(t *testing.T) {
	e := newAuthEnv(t)
	e.addAdmin(t, "lemah@coreasia.id", "super_admin")
	master, _ := e.addTOTPAdmin(t, "master@coreasia.id")
	masterHash := e.store.get(master.ID).PasswordHash

	// Sesi lemah didapat lewat login sungguhan (tanpa TOTP → mfa=false).
	lr := e.login(t, "lemah@coreasia.id")
	weak, _ := lr.data()["access_token"].(string)
	if weak == "" {
		t.Fatalf("login lemah: %v", lr.body)
	}
	if me := e.do(t, http.MethodGet, "/api/admin/auth/me", weak, nil); me.data()["mfa"] != false {
		t.Fatalf("sesi lemah harus mfa=false: %v", me.body)
	}

	base := "/api/admin/users/" + master.ID.String()
	for _, a := range []struct {
		name, method, path string
		body               any
	}{
		{"reset TOTP", http.MethodPost, base + "/totp/reset", nil},
		{"ganti sandi", http.MethodPut, base, map[string]any{"password": "SandiPelaku-123!"}},
		{"ganti email", http.MethodPut, base, map[string]any{"email": "pelaku@contoh.invalid"}},
		{"turunkan peran", http.MethodPut, base, map[string]any{"role": "admin"}},
		{"nonaktifkan", http.MethodPut, base, map[string]any{"is_active": false}},
		{"ganti nama saja", http.MethodPut, base, map[string]any{"full_name": "Bukan Master"}},
		{"hapus", http.MethodDelete, base, nil},
	} {
		r := e.do(t, a.method, a.path, weak, a.body)
		if r.status != http.StatusForbidden || r.errCode() != "MFA_REQUIRED" {
			t.Errorf("%s dari sesi mfa=false: %d %s, want 403 MFA_REQUIRED", a.name, r.status, r.errCode())
		}
	}
	got := e.store.get(master.ID)
	if !got.TOTPEnabled() || got.TokenVersion != 0 || got.PasswordHash != masterHash ||
		got.Email != "master@coreasia.id" || got.Role != "super_admin" || !got.IsActive || got.FullName != "Admin Uji" {
		t.Fatalf("akun Master tidak boleh tersentuh: %+v", got)
	}
	if !e.audit.has("mfa_required_denied") {
		t.Fatal("penolakan harus diaudit")
	}
	// Login sebagai Master tetap menuntut TOTP.
	if r := e.login(t, "master@coreasia.id"); r.data()["mfa_required"] != true || r.data()["access_token"] != nil {
		t.Fatalf("login Master harus tetap menuntut TOTP: %v", r.body)
	}

	// Pengecualian defensif: mencabut sesi Master tetap boleh (runbook langkah 0).
	if r := e.do(t, http.MethodPost, base+"/revoke-sessions", weak, nil); r.status != http.StatusOK {
		t.Fatalf("revoke-sessions dari sesi mfa=false: %d, want 200", r.status)
	}
	if e.store.get(master.ID).TokenVersion != 1 || !e.store.totpOn(master.ID) {
		t.Fatal("revoke-sessions hanya menaikkan token_version, TOTP tetap aktif")
	}

	// Masa transisi: admin tanpa TOTP tetap bisa dikelola dari sesi mfa=false.
	staf := e.addAdmin(t, "staf@coreasia.id", "admin")
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+staf.ID.String(), weak, map[string]any{"password": "SandiBaru-456!"}); r.status != http.StatusOK {
		t.Fatalf("ganti sandi admin tanpa TOTP dari sesi mfa=false: %d", r.status)
	}
	pending := "v1:tertunda"
	e.store.users[staf.ID].TOTPPendingEnc = &pending
	if r := e.do(t, http.MethodPost, "/api/admin/users/"+staf.ID.String()+"/totp/reset", weak, nil); r.status != http.StatusOK {
		t.Fatalf("reset pendaftaran yang belum aktif dari sesi mfa=false: %d", r.status)
	}
	if r := e.do(t, http.MethodDelete, "/api/admin/users/"+staf.ID.String(), weak, nil); r.status != http.StatusNoContent {
		t.Fatalf("hapus admin tanpa TOTP dari sesi mfa=false: %d", r.status)
	}
}

// Super admin lain yang sesinya lolos TOTP tetap bisa memulihkan Master
// (perangkat hilang): mengubah data, mereset TOTP, dan menghapus admin ber-TOTP.
func TestManajemenAdmin_SesiMFABolehMengelolaAkunBerTOTP(t *testing.T) {
	e := newAuthEnv(t)
	_, secret := e.addTOTPAdmin(t, "penolong@coreasia.id")
	master, _ := e.addTOTPAdmin(t, "master@coreasia.id")

	// Sesi mfa=true lewat alur sungguhan: login → tantangan → kode.
	vr := e.verify(t, e.challenge(t, "penolong@coreasia.id"), e.code(t, secret))
	tok, _ := vr.data()["access_token"].(string)
	if tok == "" {
		t.Fatalf("verify penolong: %v", vr.body)
	}
	base := "/api/admin/users/" + master.ID.String()
	if r := e.do(t, http.MethodPut, base, tok, map[string]any{"full_name": "Master"}); r.status != http.StatusOK {
		t.Fatalf("ubah nama dari sesi mfa=true: %d %v", r.status, r.body)
	}
	if r := e.do(t, http.MethodPost, base+"/totp/reset", tok, nil); r.status != http.StatusOK {
		t.Fatalf("reset TOTP dari sesi mfa=true: %d %v", r.status, r.body)
	}
	if e.store.totpOn(master.ID) {
		t.Fatal("TOTP Master harus mati setelah reset")
	}
	// Setelah reset, Master tidak lagi ber-TOTP: pengelolaan biasa berlaku.
	master2, _ := e.addTOTPAdmin(t, "master2@coreasia.id")
	if r := e.do(t, http.MethodDelete, "/api/admin/users/"+master2.ID.String(), tok, nil); r.status != http.StatusNoContent {
		t.Fatalf("hapus admin ber-TOTP dari sesi mfa=true: %d", r.status)
	}
}

// Memberi peran super admin (buat baru atau naikkan) dari sesi mfa=false
// ditolak begitu ada admin ber-TOTP. Putaran 3: pelaku tanpa TOTP juga ditolak
// (dulu boleh, dan itulah jalur A: super admin baru → daftar TOTP → mfa=true).
// Hanya selama belum ada satu pun admin ber-TOTP (transisi) pemberian bebas.
func TestManajemenAdmin_SuperAdminBaruDariPelakuBerTOTP(t *testing.T) {
	e := newAuthEnv(t)
	actor, _ := e.addTOTPAdmin(t, "pelaku@coreasia.id")
	// TOTP aktif tetapi sesi mfa=false dengan tv yang masih berlaku: keadaan
	// yang hanya muncul bila TOTP diaktifkan di luar /totp/enable (mis. SQL).
	weak := e.tokens(t, actor, false).AccessToken
	strong := e.tokens(t, actor, true).AccessToken
	staf := e.addAdmin(t, "staf@coreasia.id", "admin")

	create := func(tok, email, role string) reply {
		return e.do(t, http.MethodPost, "/api/admin/users", tok, map[string]any{
			"email": email, "password": "SandiKuat-123!", "full_name": "Baru", "role": role,
		})
	}
	if r := create(weak, "baru1@contoh.invalid", "super_admin"); r.status != http.StatusForbidden || r.errCode() != "MFA_REQUIRED" {
		t.Fatalf("buat super admin dari sesi mfa=false: %d %s", r.status, r.errCode())
	}
	if u, _ := e.store.FindByEmail(context.Background(), "baru1@contoh.invalid"); u != nil {
		t.Fatal("super admin tidak boleh terbuat")
	}
	if r := create(weak, "baru2@contoh.invalid", "admin"); r.status != http.StatusCreated {
		t.Fatalf("buat admin biasa dari sesi mfa=false: %d %v", r.status, r.body)
	}
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+staf.ID.String(), weak, map[string]any{"role": "super_admin"}); r.status != http.StatusForbidden {
		t.Fatalf("naikkan ke super admin dari sesi mfa=false: %d", r.status)
	}
	if e.store.get(staf.ID).Role != "admin" {
		t.Fatal("peran staf tidak boleh berubah")
	}
	if r := create(strong, "baru3@contoh.invalid", "super_admin"); r.status != http.StatusCreated {
		t.Fatalf("buat super admin dari sesi mfa=true: %d %v", r.status, r.body)
	}

	// Pelaku tanpa TOTP saat sudah ada admin ber-TOTP: ditolak (putaran 3).
	plain := e.addAdmin(t, "biasa@coreasia.id", "super_admin")
	if r := create(e.tokens(t, plain, false).AccessToken, "baru4@contoh.invalid", "super_admin"); r.status != http.StatusForbidden || r.errCode() != "MFA_REQUIRED" {
		t.Fatalf("buat super admin oleh pelaku tanpa TOTP (TOTP berlaku): %d %v", r.status, r.body)
	}

	// Masa transisi (belum ada satu pun admin ber-TOTP): boleh.
	e2 := newAuthEnv(t)
	awal := e2.addAdmin(t, "awal@coreasia.id", "super_admin")
	if r := e2.do(t, http.MethodPost, "/api/admin/users", e2.tokens(t, awal, false).AccessToken, map[string]any{
		"email": "baru5@contoh.invalid", "password": "SandiKuat-123!", "full_name": "Baru", "role": "super_admin",
	}); r.status != http.StatusCreated {
		t.Fatalf("buat super admin di masa transisi: %d %v", r.status, r.body)
	}
}

// ───────────────────────── batas sandi /login per akun ─────────────────────────

func (e *authEnv) loginWith(t *testing.T, email, password string) reply {
	t.Helper()
	return e.do(t, http.MethodPost, "/api/admin/auth/login", "", map[string]string{"email": email, "password": password})
}

// Temuan: batas /login hanya per IP, dan IP-nya bisa dikarang lewat
// X-Forwarded-For. Kini ada batas per akun di Redis yang tidak bergantung pada
// IP: tebakan dari mana pun ke satu email berhenti di loginMaxFailures.
func TestLogin_BatasPercobaanPerAkun(t *testing.T) {
	e := newAuthEnv(t)
	e.addAdmin(t, "target@coreasia.id", "super_admin")
	key := auth.LoginAttemptKey("target@coreasia.id")

	for i := 1; i <= loginMaxFailures; i++ {
		if r := e.loginWith(t, "target@coreasia.id", "TebakanSalah-"+strconv.Itoa(i)); r.status != http.StatusUnauthorized {
			t.Fatalf("tebakan ke-%d: %d, want 401", i, r.status)
		}
	}
	// Jatah habis: sandi BENAR pun tidak dievaluasi.
	r := e.login(t, "target@coreasia.id")
	if r.status != http.StatusTooManyRequests || r.header.Get("Retry-After") == "" || r.data() != nil {
		t.Fatalf("setelah %d gagal: %d %v (Retry-After %q)", loginMaxFailures, r.status, r.body, r.header.Get("Retry-After"))
	}
	if r.cookie("auth_admin_token") != nil {
		t.Fatal("429 tidak boleh memasang cookie")
	}
	// Huruf besar/kecil dan spasi tepi tidak menghasilkan jatah baru.
	if r := e.loginWith(t, "TARGET@coreasia.id", "TebakanSalah-x"); r.status != http.StatusTooManyRequests {
		t.Fatalf("varian huruf besar: %d, want 429", r.status)
	}

	// Jendela berakhir (di Redis: TTL habis) → sandi benar diterima dan hitungan kembali nol.
	_ = e.loginLimiter.ResetKey(context.Background(), key)
	if r := e.login(t, "target@coreasia.id"); r.status != http.StatusOK || r.data()["access_token"] == nil {
		t.Fatalf("sandi benar setelah jendela: %d %v", r.status, r.body)
	}
	if n := e.loginLimiter.countKey(key); n != 0 {
		t.Fatalf("login berhasil harus mengembalikan jatah, hitungan = %d", n)
	}
	// Admin lain tidak terpengaruh.
	e.addAdmin(t, "lain@coreasia.id", "admin")
	if r := e.login(t, "lain@coreasia.id"); r.status != http.StatusOK {
		t.Fatalf("admin lain: %d", r.status)
	}
}

// Email yang tidak terdaftar dibatasi dengan cara yang sama, jadi 429 tidak
// membocorkan email mana yang terdaftar.
func TestLogin_BatasPerAkun_EmailTakTerdaftarSama(t *testing.T) {
	e := newAuthEnv(t)
	for i := 1; i <= loginMaxFailures; i++ {
		if r := e.loginWith(t, "tidak-ada@coreasia.id", "TebakanSalah-1"); r.status != http.StatusUnauthorized {
			t.Fatalf("percobaan ke-%d: %d", i, r.status)
		}
	}
	if r := e.loginWith(t, "tidak-ada@coreasia.id", "TebakanSalah-1"); r.status != http.StatusTooManyRequests {
		t.Fatalf("email tak terdaftar setelah %d gagal: %d, want 429", loginMaxFailures, r.status)
	}
}

// Sandi benar untuk admin ber-TOTP (tantangan, belum token) juga
// mengembalikan jatah sandi; faktor kedua punya jatahnya sendiri.
func TestLogin_BatasPerAkun_TantanganMengembalikanJatah(t *testing.T) {
	e := newAuthEnv(t)
	u, _ := e.addTOTPAdmin(t, "mfa@coreasia.id")
	for i := 0; i < 3; i++ {
		_ = e.loginWith(t, "mfa@coreasia.id", "TebakanSalah-9")
	}
	if r := e.login(t, "mfa@coreasia.id"); r.data()["mfa_required"] != true {
		t.Fatalf("login ber-TOTP: %v", r.body)
	}
	if n := e.loginLimiter.countKey(auth.LoginAttemptKey("mfa@coreasia.id")); n != 0 {
		t.Fatalf("sandi benar harus mengembalikan jatah, hitungan = %d", n)
	}
	if e.limiter.count(u.ID) != 0 {
		t.Fatal("jatah TOTP tidak disentuh oleh /login")
	}
}

// Redis tidak terjangkau: batas per akun gagal terbuka (login tetap berjalan,
// batas per IP tetap berlaku). Faktor kedua tetap gagal tertutup.
func TestLogin_BatasPerAkun_RedisMatiGagalTerbuka(t *testing.T) {
	e := newAuthEnv(t)
	e.addAdmin(t, "a@coreasia.id", "admin")
	e.loginLimiter.down = true
	if r := e.login(t, "a@coreasia.id"); r.status != http.StatusOK || r.data()["access_token"] == nil {
		t.Fatalf("login saat Redis mati: %d %v", r.status, r.body)
	}
	if r := e.loginWith(t, "a@coreasia.id", "TebakanSalah-1"); r.status != http.StatusUnauthorized {
		t.Fatalf("sandi salah saat Redis mati: %d", r.status)
	}
}

// Batas per akun dengan Redis sungguhan (opt-in; DB 15, kunci dihapus sesudahnya).
func TestLogin_BatasPerAkun_RedisSungguhan(t *testing.T) {
	addr := os.Getenv("GATEWAY_TEST_REDIS_ADDR")
	if addr == "" {
		t.Skip("GATEWAY_TEST_REDIS_ADDR tidak di-set")
	}
	rdb := redis.NewClient(&redis.Options{Addr: addr, DB: 15})
	defer rdb.Close()
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		t.Skipf("redis %s tidak terjangkau: %v", addr, err)
	}
	lim := auth.NewRedisLoginLimiter(rdb, loginMaxFailures, loginFailureWindow, loginOriginTTL)
	email := "uji-" + uuid.NewString() + "@contoh.invalid"
	key := auth.LoginAttemptKey(email)
	ctx := context.Background()
	defer lim.ResetKey(ctx, key)

	for i := 1; i <= loginMaxFailures; i++ {
		allowed, n, _, err := lim.TakeKey(ctx, key)
		if err != nil || !allowed || n != int64(i) {
			t.Fatalf("pesanan ke-%d: allowed=%v n=%d err=%v", i, allowed, n, err)
		}
	}
	allowed, _, retry, err := lim.TakeKey(ctx, key)
	if err != nil || allowed || retry <= 0 || retry > loginFailureWindow {
		t.Fatalf("setelah batas: allowed=%v retry=%v err=%v", allowed, retry, err)
	}
	if err := lim.ResetKey(ctx, key); err != nil {
		t.Fatal(err)
	}
	if allowed, n, _, _ := lim.TakeKey(ctx, key); !allowed || n != 1 {
		t.Fatalf("setelah reset: allowed=%v n=%d", allowed, n)
	}
}
