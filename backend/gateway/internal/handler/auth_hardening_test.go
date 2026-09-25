package handler

import (
	"context"
	"net/http"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/config"
	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/testenv"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// Uji pengerasan Fase 0c putaran 1: pemesanan jatah percobaan yang atomik,
// pembatas IP /totp/verify, sandi di /totp/setup, reset TOTP oleh super admin,
// sesi hidup di manajemen admin, dan penjaga JWT_SECRET.

// ───────────────────────── batas percobaan paralel ─────────────────────────

// parallelWrongVerify mengirim n kode salah sekaligus dengan satu tantangan dan
// menghitung status jawaban.
func parallelWrongVerify(t *testing.T, e *authEnv, email, secret string, n int) map[int]int {
	t.Helper()
	ch := e.challenge(t, email)
	wrong := e.wrongCode(t, secret)
	var (
		mu     sync.Mutex
		counts = map[int]int{}
		wg     sync.WaitGroup
		start  = make(chan struct{})
	)
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			r := e.verify(t, ch, wrong)
			mu.Lock()
			counts[r.status]++
			mu.Unlock()
		}()
	}
	close(start)
	wg.Wait()
	return counts
}

// Temuan: cek (GET) dan catat (INCR) yang terpisah membuat 80–90 dari 200
// tebakan paralel dievaluasi. Dengan pemesanan sebelum evaluasi, kode salah
// dievaluasi paling banyak totpMaxFailures kali, berapa pun paralelismenya.
func TestTOTPVerify_ParalelTidakMelampauiBatas(t *testing.T) {
	e := newAuthEnv(t)
	e.store.findDelay = 3 * time.Millisecond // latensi DB memperlebar celah lama
	_, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")

	counts := parallelWrongVerify(t, e, "mfa@coreasia.id", secret, 60)
	if got := e.evals.Load(); got > totpMaxFailures {
		t.Fatalf("kode dievaluasi %d kali, batas %d (status: %v)", got, totpMaxFailures, counts)
	}
	if counts[http.StatusUnauthorized] > totpMaxFailures {
		t.Fatalf("401 = %d, batas %d (status: %v)", counts[http.StatusUnauthorized], totpMaxFailures, counts)
	}
	if counts[http.StatusUnauthorized]+counts[http.StatusTooManyRequests] != 60 {
		t.Fatalf("status tak terduga: %v", counts)
	}
}

// Sama, dengan RedisAttemptLimiter sungguhan (opt-in; DB 15, kunci milik admin
// acak dihapus sesudahnya).
func TestTOTPVerify_ParalelRedisSungguhan(t *testing.T) {
	addr := testenv.RedisAddr(t)
	rdb := redis.NewClient(&redis.Options{Addr: addr, DB: 15})
	defer rdb.Close()
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		testenv.Unavailable(t, "redis %s tidak terjangkau: %v", addr, err)
	}
	var lim *auth.RedisTOTPLimiter
	e := newAuthEnvWith(t, envOpts{attemptsFor: func(f *fakeAdminStore) totpAttemptLimiter {
		lim = auth.NewRedisTOTPLimiter(rdb, f, totpMaxFailures, totpFailureWindow, totpMaxFailuresLong, totpFailureWindowLong)
		return lim
	}})
	e.store.findDelay = 3 * time.Millisecond
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	defer lim.Clear(ctx, u.ID)

	for round := 0; round < 3; round++ {
		_ = lim.Clear(ctx, u.ID)
		e.evals.Store(0)
		counts := parallelWrongVerify(t, e, "mfa@coreasia.id", secret, 100)
		if got := e.evals.Load(); got > totpMaxFailures || counts[http.StatusUnauthorized] > totpMaxFailures {
			t.Fatalf("putaran %d: kode dievaluasi %d kali (status: %v)", round, got, counts)
		}
	}
}

// Temuan: galat tulis Redis (READONLY, putus di antara GET dan INCR) dulu hanya
// dicatat di log, dan tebakan jadi tanpa batas. Sekarang pemesanan yang gagal
// = 503 dan kode tidak dievaluasi sama sekali, di keempat endpoint.
func TestTOTP_PemesananGagal_503TanpaEvaluasi(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	ch := e.challenge(t, "mfa@coreasia.id")
	fresh := e.addAdmin(t, "baru@coreasia.id", "admin")
	freshTok := e.tokens(t, fresh, false).AccessToken
	pending := "v1:tertunda"
	e.store.users[fresh.ID].TOTPPendingEnc = &pending
	e.limiter.down = true

	if r := e.verify(t, ch, e.code(t, secret)); r.status != http.StatusServiceUnavailable || len(r.cookies) != 0 {
		t.Fatalf("verify: %d", r.status)
	}
	// Kode BENAR di disable pun tidak dievaluasi: TOTP tetap aktif.
	e.clock = e.clock.Add(30 * time.Second)
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/disable", e.tokens(t, u, true).AccessToken, map[string]string{"code": e.code(t, secret)}); r.status != http.StatusServiceUnavailable {
		t.Fatalf("disable: %d", r.status)
	}
	if !e.store.totpOn(u.ID) {
		t.Fatal("TOTP tidak boleh mati saat pembatas tidak bisa memesan jatah")
	}
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/enable", freshTok, map[string]string{"code": "123456"}); r.status != http.StatusServiceUnavailable {
		t.Fatalf("enable: %d", r.status)
	}
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/setup", freshTok, setupBody); r.status != http.StatusServiceUnavailable {
		t.Fatalf("setup: %d", r.status)
	}
	if got := e.evals.Load(); got != 0 {
		t.Fatalf("kode dievaluasi %d kali tanpa jatah", got)
	}
}

// Pembatas IP di depan /totp/verify: 10 per 15 menit per IP, lintas admin.
func TestTOTPVerify_BatasPerIP(t *testing.T) {
	e := newAuthEnvWith(t, envOpts{verifyLimit: mw.NewIPRateLimiter(10, 15*time.Minute, false).MiddlewareBy(mw.ClientIPKey)})
	type akun struct{ email, secret, ch string }
	var list []akun
	for _, email := range []string{"a@coreasia.id", "b@coreasia.id", "c@coreasia.id"} {
		_, secret := e.addTOTPAdmin(t, email)
		list = append(list, akun{email, secret, e.challenge(t, email)})
	}
	sent := 0
	for round := 0; round < 4; round++ { // 4 per admin: di bawah batas per admin
		for _, a := range list {
			r := e.verify(t, a.ch, e.wrongCode(t, a.secret))
			sent++
			want := http.StatusUnauthorized
			if sent > 10 {
				want = http.StatusTooManyRequests
			}
			if r.status != want {
				t.Fatalf("permintaan ke-%d (%s): status = %d, want %d", sent, a.email, r.status, want)
			}
		}
	}
}

// ───────────────────────── setup wajib sandi ─────────────────────────

func TestTOTPSetup_WajibSandiSaatIni(t *testing.T) {
	e := newAuthEnv(t)
	u := e.addAdmin(t, "a@coreasia.id", "admin")
	tok := e.tokens(t, u, false).AccessToken
	setup := func(body any) reply {
		return e.do(t, http.MethodPost, "/api/admin/auth/totp/setup", tok, body)
	}

	// Token saja (cookie/refresh curian) tidak cukup.
	if r := setup(nil); r.status != http.StatusBadRequest {
		t.Fatalf("tanpa sandi: %d", r.status)
	}
	if e.limiter.count(u.ID) != 0 {
		t.Fatal("permintaan tanpa sandi tidak memakai jatah")
	}
	for i := 1; i <= totpMaxFailures; i++ {
		r := setup(map[string]string{"password": "BukanSandi-9"})
		if r.status != http.StatusBadRequest || r.errCode() != "PASSWORD_INVALID" {
			t.Fatalf("sandi salah ke-%d: %d %s", i, r.status, r.errCode())
		}
		if r.data() != nil {
			t.Fatal("sandi salah tidak boleh memulangkan rahasia")
		}
	}
	if e.store.get(u.ID).TOTPPendingEnc != nil {
		t.Fatal("sandi salah tidak boleh menyimpan rahasia tertunda")
	}
	// Tidak bisa dipakai menebak sandi tanpa batas: jatahnya sama dengan kode TOTP.
	if r := setup(setupBody); r.status != http.StatusTooManyRequests {
		t.Fatalf("setelah %d sandi salah: %d, want 429", totpMaxFailures, r.status)
	}

	_ = e.limiter.Reset(context.Background(), u.ID)
	r := setup(setupBody)
	if r.status != http.StatusOK || r.data()["secret"] == nil {
		t.Fatalf("sandi benar: %d %v", r.status, r.body)
	}
	if e.limiter.count(u.ID) != 0 {
		t.Fatal("sandi benar mengembalikan jatah")
	}
	if !e.audit.has("totp_setup") {
		t.Fatal("setup harus diaudit")
	}
}

// ───────────────────────── reset TOTP oleh super admin ─────────────────────────

func TestResetTOTP_OlehSuperAdmin(t *testing.T) {
	e := newAuthEnv(t)
	// Sesi kuat: TOTP boss aktif sejak lama dan sesinya lolos TOTP.
	boss, _ := e.addTOTPAdmin(t, "boss@coreasia.id")
	bossTok := e.tokens(t, boss, true).AccessToken
	target, _ := e.addTOTPAdmin(t, "staf@coreasia.id")
	e.store.users[target.ID].Role = "admin"
	targetTok := e.tokens(t, target, true)
	path := "/api/admin/users/" + target.ID.String() + "/totp/reset"

	// Admin biasa tidak boleh.
	if r := e.do(t, http.MethodPost, "/api/admin/users/"+boss.ID.String()+"/totp/reset", targetTok.AccessToken, nil); r.status != http.StatusForbidden {
		t.Fatalf("admin biasa: %d", r.status)
	}

	r := e.do(t, http.MethodPost, path, bossTok, nil)
	if r.status != http.StatusOK || r.data()["totp_enabled"] != false || r.data()["sessions_revoked"] != true {
		t.Fatalf("reset: %d %v", r.status, r.body)
	}
	cur := e.store.get(target.ID)
	if cur.TOTPEnabled() || cur.TOTPSecretEnc != nil || cur.TOTPLastStep != nil || cur.TokenVersion != 1 {
		t.Fatalf("keadaan setelah reset: %+v", cur)
	}
	if !e.audit.has("totp_reset") {
		t.Fatal("reset harus diaudit")
	}
	if me := e.do(t, http.MethodGet, "/api/admin/auth/me", targetTok.AccessToken, nil); me.status != http.StatusUnauthorized {
		t.Fatalf("sesi target harus gugur: %d", me.status)
	}
	// Login kembali tanpa TOTP (pemilik mendaftar ulang).
	if r := e.login(t, "staf@coreasia.id"); r.data()["access_token"] == nil {
		t.Fatalf("setelah reset, login tanpa TOTP: %v", r.body)
	}

	// Akun sendiri: pakai /auth/totp/disable (butuh sesi MFA + kode).
	if r := e.do(t, http.MethodPost, "/api/admin/users/"+boss.ID.String()+"/totp/reset", bossTok, nil); r.status != http.StatusBadRequest {
		t.Fatalf("reset diri sendiri: %d", r.status)
	}
	if r := e.do(t, http.MethodPost, "/api/admin/users/"+uuid.NewString()+"/totp/reset", bossTok, nil); r.status != http.StatusNotFound {
		t.Fatalf("id tak dikenal: %d", r.status)
	}
}

// ───────────────────────── sesi hidup di manajemen admin ─────────────────────────

// Temuan: setelah token super admin dicabut, /me menolak, tetapi token yang
// sama masih bisa menonaktifkan pembelanya, menaikkan peran admin lain, dan
// mencabut sesi. Sekarang semua rute /users menolak token yang dicabut.
func TestManajemenAdmin_TokenDicabutDitolak(t *testing.T) {
	e := newAuthEnv(t)
	bocor := e.addAdmin(t, "bocor@coreasia.id", "super_admin")
	pembela := e.addAdmin(t, "pembela@coreasia.id", "super_admin")
	staf := e.addAdmin(t, "staf@coreasia.id", "admin")
	bocorTok := e.tokens(t, bocor, true).AccessToken
	pembelaTok := e.tokens(t, pembela, true).AccessToken

	// Pembela mencabut sesi akun yang tokennya bocor.
	if r := e.do(t, http.MethodPost, "/api/admin/users/"+bocor.ID.String()+"/revoke-sessions", pembelaTok, nil); r.status != http.StatusOK {
		t.Fatalf("revoke: %d %v", r.status, r.body)
	}

	attempts := []struct {
		name, method, path string
		body               any
	}{
		{"nonaktifkan pembela", http.MethodPut, "/api/admin/users/" + pembela.ID.String(), map[string]any{"is_active": false}},
		{"naikkan peran staf", http.MethodPut, "/api/admin/users/" + staf.ID.String(), map[string]any{"role": "super_admin", "password": "SandiBaru-456!"}},
		{"cabut sesi pembela", http.MethodPost, "/api/admin/users/" + pembela.ID.String() + "/revoke-sessions", nil},
		{"reset TOTP pembela", http.MethodPost, "/api/admin/users/" + pembela.ID.String() + "/totp/reset", nil},
		{"buat admin baru", http.MethodPost, "/api/admin/users", map[string]any{"email": "pintu@contoh.invalid", "password": "SandiKuat-123!", "full_name": "Pintu", "role": "super_admin"}},
		{"hapus staf", http.MethodDelete, "/api/admin/users/" + staf.ID.String(), nil},
		{"daftar admin", http.MethodGet, "/api/admin/users", nil},
	}
	for _, a := range attempts {
		if r := e.do(t, a.method, a.path, bocorTok, a.body); r.status != http.StatusUnauthorized {
			t.Errorf("%s dengan token dicabut: status = %d, want 401", a.name, r.status)
		}
	}
	if p := e.store.get(pembela.ID); !p.IsActive || p.TokenVersion != 0 {
		t.Fatalf("pembela tidak boleh tersentuh: %+v", p)
	}
	if s := e.store.get(staf.ID); s.Role != "admin" || s.TokenVersion != 0 {
		t.Fatalf("staf tidak boleh tersentuh: %+v", s)
	}
	if u, _ := e.store.FindByEmail(context.Background(), "pintu@contoh.invalid"); u != nil {
		t.Fatal("admin baru tidak boleh terbuat")
	}

	// Akun nonaktif (tanpa kenaikan tv, mis. lewat SQL) juga ditolak.
	e.store.users[pembela.ID].IsActive = false
	if r := e.do(t, http.MethodGet, "/api/admin/users", pembelaTok, nil); r.status != http.StatusUnauthorized {
		t.Fatalf("akun nonaktif: %d", r.status)
	}
}

// Peran diambil dari DB, bukan dari klaim: super admin yang diturunkan lewat
// SQL (tv tidak naik) kehilangan izin /users seketika.
func TestManajemenAdmin_PeranDariDB(t *testing.T) {
	e := newAuthEnv(t)
	boss := e.addAdmin(t, "boss@coreasia.id", "super_admin")
	staf := e.addAdmin(t, "staf@coreasia.id", "admin")
	tok := e.tokens(t, boss, true).AccessToken
	e.store.users[boss.ID].Role = "admin"
	if r := e.do(t, http.MethodPost, "/api/admin/users/"+staf.ID.String()+"/revoke-sessions", tok, nil); r.status != http.StatusForbidden {
		t.Fatalf("peran di DB admin biasa: %d, want 403", r.status)
	}
}

func TestUpdateAdmin_GantiPeranMencabutSesi(t *testing.T) {
	e := newAuthEnv(t)
	boss := e.addAdmin(t, "boss@coreasia.id", "super_admin")
	target := e.addAdmin(t, "staf@coreasia.id", "super_admin")
	bossTok := e.tokens(t, boss, true).AccessToken
	path := "/api/admin/users/" + target.ID.String()

	// Peran sama (form mengirim ulang semua kolom): sesi tidak dicabut.
	if r := e.do(t, http.MethodPut, path, bossTok, map[string]any{"role": "super_admin", "full_name": "Staf"}); r.status != http.StatusOK {
		t.Fatalf("peran sama: %d", r.status)
	}
	if e.store.get(target.ID).TokenVersion != 0 {
		t.Fatal("peran yang tidak berubah tidak mencabut sesi")
	}
	if r := e.do(t, http.MethodPut, path, bossTok, map[string]any{"role": "admin"}); r.status != http.StatusOK {
		t.Fatalf("turunkan peran: %d", r.status)
	}
	if got := e.store.get(target.ID); got.Role != "admin" || got.TokenVersion != 1 {
		t.Fatalf("ganti peran harus mencabut sesi: %+v", got)
	}
}

// ───────────────────────── penjaga JWT_SECRET ─────────────────────────

// devJWTSecret membaca secret yang ter-commit di configs/config.yaml.
func devJWTSecret(t *testing.T) string {
	t.Helper()
	t.Setenv("JWT_SECRET", "")
	os.Unsetenv("JWT_SECRET") // cleanenv menimpa YAML bila env ADA, walau kosong
	cfg, err := config.Load("../../configs/config.yaml")
	if err != nil {
		t.Fatal(err)
	}
	return cfg.JWT.Secret
}

func TestGuardJWTSecret(t *testing.T) {
	dev := devJWTSecret(t)
	strong := auth.RandomJWTSecret()

	for _, explicit := range []string{"production", ""} {
		if got, ok := guardJWTSecret(strong, "production", explicit); !ok || got != strong {
			t.Fatalf("secret kuat harus dipakai apa adanya (APP_ENV eksplisit %q)", explicit)
		}
	}
	if got, ok := guardJWTSecret(dev, "development", "development"); !ok || got != dev {
		t.Fatal("APP_ENV=development eksplisit boleh memakai secret repo")
	}
	// Temuan putaran 2: config.yaml (ikut di image) memberi env "development"
	// saat APP_ENV tidak di-set. Itu bukan izin untuk secret lemah.
	for _, tc := range []struct{ env, explicit string }{
		{"development", ""}, // .env produksi kehilangan APP_ENV
		{"production", "production"},
		{"staging", "staging"},
		{"", ""},
	} {
		for name, secret := range map[string]string{"repo": dev, "pendek": "rahasia-pendek", "kosong": ""} {
			got, ok := guardJWTSecret(secret, tc.env, tc.explicit)
			if ok || got == secret || len(got) < auth.MinJWTSecretBytes {
				t.Errorf("env %q (eksplisit %q), secret %s: harus ditolak dan diganti secret acak", tc.env, tc.explicit, name)
			}
		}
	}
	if _, ok := guardJWTSecret("", "development", "development"); ok {
		t.Error("secret kosong ditolak di semua lingkungan (HS256 dengan kunci kosong bisa dipalsukan)")
	}
}

// unsetAppEnv: APP_ENV tidak ada di environment proses (dipulihkan sesudah uji).
func unsetAppEnv(t *testing.T) {
	t.Helper()
	t.Setenv("APP_ENV", "")
	os.Unsetenv("APP_ENV")
}

// Server sungguhan dengan config seperti image produksi yang .env-nya
// kehilangan APP_ENV dan JWT_SECRET: env "development" (dari config.yaml) dan
// secret repo. Auth admin harus mati (503); dulu hanya WARN dan secret repo
// dipakai untuk JWT dan kunci TOTP.
func TestServer_APPENVDariYAMLBukanPengecualian(t *testing.T) {
	dev := devJWTSecret(t)
	newApp := func() *authEnv {
		cfg := &config.Config{}
		cfg.App.Env = "development" // nilai configs/config.yaml
		cfg.JWT.Secret = dev
		cfg.JWT.Issuer = "coreasia-gateway"
		return &authEnv{app: NewServer(cfg, nil, nil).App()}
	}
	forged, _ := auth.NewJWTProvider(dev, time.Hour, time.Hour, "coreasia-gateway").
		GenerateTokenPair(uuid.New(), "palsu@contoh.invalid", "super_admin", "Palsu", true, 0)

	unsetAppEnv(t)
	e := newApp()
	if r := e.do(t, http.MethodGet, "/api/admin/auth/me", forged.AccessToken, nil); r.status != http.StatusServiceUnavailable {
		t.Fatalf("APP_ENV tidak di-set, secret repo: /me = %d, want 503", r.status)
	}
	if r := e.do(t, http.MethodPost, "/api/admin/auth/login", "", map[string]string{}); r.status != http.StatusServiceUnavailable {
		t.Fatalf("APP_ENV tidak di-set, secret repo: /login = %d, want 503", r.status)
	}

	// Pengembangan lokal: APP_ENV=development eksplisit tetap boleh.
	t.Setenv("APP_ENV", "development")
	e = newApp()
	if r := e.do(t, http.MethodGet, "/api/admin/auth/me", "", nil); r.status != http.StatusUnauthorized {
		t.Fatalf("APP_ENV=development eksplisit, tanpa token: %d, want 401", r.status)
	}
}

// Server sungguhan: secret repo di luar development mematikan /api/admin/**
// (503) dan token rakitan dari secret repo tidak sah, sedangkan rute publik
// produk berbayar tetap berjalan.
func TestServer_JWTSecretRepoDiProduksi(t *testing.T) {
	dev := devJWTSecret(t)
	t.Setenv("APP_ENV", "production")
	cfg := &config.Config{}
	cfg.App.Env = "production"
	cfg.JWT.Secret = dev
	cfg.JWT.Issuer = "coreasia-gateway"
	app := NewServer(cfg, nil, nil).App()

	forged, _ := auth.NewJWTProvider(dev, time.Hour, time.Hour, "coreasia-gateway").
		GenerateTokenPair(uuid.New(), "palsu@contoh.invalid", "super_admin", "Palsu", true, 0)
	e := &authEnv{app: app}
	for _, tc := range []struct{ method, path, bearer string }{
		{http.MethodPost, "/api/admin/auth/login", ""},
		{http.MethodPost, "/api/admin/auth/totp/verify", ""},
		{http.MethodGet, "/api/admin/auth/me", forged.AccessToken},
		{http.MethodGet, "/api/admin/auth/permissions", forged.AccessToken},
		{http.MethodGet, "/api/admin/cad/licenses", forged.AccessToken},
	} {
		if r := e.do(t, tc.method, tc.path, tc.bearer, map[string]string{}); r.status != http.StatusServiceUnavailable {
			t.Errorf("%s %s: status = %d, want 503", tc.method, tc.path, r.status)
		}
	}
	// Rute publik (aktivasi lisensi) tidak terpengaruh: validasi → 400, bukan 503.
	if r := e.do(t, http.MethodPost, "/api/cad/activate", "", map[string]string{}); r.status != http.StatusBadRequest {
		t.Fatalf("/api/cad/activate: status = %d, want 400", r.status)
	}

	// Secret kuat: auth admin berjalan seperti biasa (tanpa token → 401).
	cfg2 := &config.Config{}
	cfg2.App.Env = "production"
	cfg2.JWT.Secret = auth.RandomJWTSecret()
	app2 := NewServer(cfg2, nil, nil).App()
	e2 := &authEnv{app: app2}
	if r := e2.do(t, http.MethodGet, "/api/admin/auth/me", "", nil); r.status != http.StatusUnauthorized {
		t.Fatalf("secret kuat, tanpa token: %d, want 401", r.status)
	}
	if r := e2.do(t, http.MethodGet, "/api/admin/auth/me", forged.AccessToken, nil); r.status != http.StatusUnauthorized {
		t.Fatalf("secret kuat, token rakitan secret repo: %d, want 401", r.status)
	}
}
