package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/testenv"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// Uji pengerasan Fase 0c putaran 4: balapan baca-ubah-tulis di PUT
// /api/admin/users/:id, kunci /login per akun yang bisa dipakai siapa pun, dan
// ganti sandi sendiri dari console yang sedang tayang.

// ───────────────────────── temuan 1: lost update ─────────────────────────

// gatedStore menahan satu panggilan repositori sampai dilepas, supaya urutan
// balapan bisa diatur tanpa bergantung pada jadwal goroutine.
type gatedStore struct {
	*fakeAdminStore
	holdUpdate func(u *model.AdminUser) bool // true = tahan Update ini
	holdFindN  int                           // tahan FindByID ke-n untuk findID (0 = mati)
	findID     uuid.UUID
	findSeen   int
	mu         sync.Mutex
	arrived    chan struct{}
	release    chan struct{}
	once       sync.Once
}

func newGatedStore(f *fakeAdminStore) *gatedStore {
	return &gatedStore{fakeAdminStore: f, arrived: make(chan struct{}), release: make(chan struct{})}
}

func (g *gatedStore) hold() {
	g.once.Do(func() { close(g.arrived) })
	<-g.release
}

func (g *gatedStore) Update(ctx context.Context, u *model.AdminUser, revoke bool) (bool, error) {
	g.mu.Lock()
	h := g.holdUpdate != nil && g.holdUpdate(u)
	if h {
		g.holdUpdate = nil
	}
	g.mu.Unlock()
	if h {
		g.hold()
	}
	return g.fakeAdminStore.Update(ctx, u, revoke)
}

func (g *gatedStore) FindByID(ctx context.Context, id uuid.UUID) (*model.AdminUser, error) {
	g.mu.Lock()
	h := false
	if g.holdFindN > 0 && id == g.findID {
		g.findSeen++
		if g.findSeen == g.holdFindN {
			h = true
			g.holdFindN = 0
		}
	}
	g.mu.Unlock()
	if h {
		g.hold()
	}
	return g.fakeAdminStore.FindByID(ctx, id)
}

// PoC temuan 1: pelaku (super admin ber-sandi-bocor, tanpa TOTP) mengulang PUT
// diri {full_name}. Permintaannya memuat baris SEBELUM Master menonaktifkan /
// mengganti sandi / menurunkan perannya, lalu menulis SESUDAHNYA. Dulu tulisan
// itu mengembalikan is_active, hash sandi, dan peran lama (pelaku login ulang
// dengan sandi bocor, 200). Kini ditolak 409 dan aksi Master bertahan.
func TestPutaran4_PUTDiriBasiTidakMembatalkanAksiMaster(t *testing.T) {
	const sandiMaster = "SandiDariMaster-1!"
	for _, tc := range []struct {
		name string
		body map[string]any
		cek  func(t *testing.T, e *authEnv, u model.AdminUser, oldHash string)
	}{
		{"nonaktif", map[string]any{"is_active": false}, func(t *testing.T, e *authEnv, u model.AdminUser, _ string) {
			if u.IsActive {
				t.Fatal("penonaktifan oleh Master dibatalkan")
			}
			if r := e.login(t, "bocor@coreasia.id"); r.status != http.StatusUnauthorized {
				t.Fatalf("login ulang pelaku: %d, want 401", r.status)
			}
		}},
		{"ganti_sandi", map[string]any{"password": sandiMaster}, func(t *testing.T, e *authEnv, u model.AdminUser, oldHash string) {
			if u.PasswordHash == oldHash {
				t.Fatal("hash sandi kembali ke sandi yang bocor")
			}
			if r := e.login(t, "bocor@coreasia.id"); r.status != http.StatusUnauthorized {
				t.Fatalf("login ulang dengan sandi bocor: %d, want 401", r.status)
			}
			if r := e.loginWith(t, "bocor@coreasia.id", sandiMaster); r.status != http.StatusOK {
				t.Fatalf("sandi dari Master harus berlaku: %d", r.status)
			}
		}},
		{"turunkan_peran", map[string]any{"role": "admin"}, func(t *testing.T, e *authEnv, u model.AdminUser, _ string) {
			if u.Role != "admin" {
				t.Fatalf("peran kembali menjadi %s", u.Role)
			}
		}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var g *gatedStore
			e := newAuthEnvWith(t, envOpts{wrap: func(f *fakeAdminStore) adminUserStore { g = newGatedStore(f); return g }})
			master, _ := e.addTOTPAdmin(t, "master@coreasia.id")
			pelaku := e.addAdmin(t, "bocor@coreasia.id", "super_admin")
			oldHash := e.store.get(pelaku.ID).PasswordHash
			path := "/api/admin/users/" + pelaku.ID.String()
			pTok := e.tokens(t, pelaku, false).AccessToken
			mTok := e.tokens(t, master, true).AccessToken
			g.holdUpdate = func(u *model.AdminUser) bool { return u.ID == pelaku.ID && u.FullName == "loop" }

			var wg sync.WaitGroup
			var pr reply
			wg.Add(1)
			go func() {
				defer wg.Done()
				pr = e.do(t, http.MethodPut, path, pTok, map[string]any{"full_name": "loop"})
			}()
			<-g.arrived // snapshot pelaku sudah dimuat, tulisannya tertahan
			if r := e.do(t, http.MethodPut, path, mTok, tc.body); r.status != http.StatusOK {
				t.Fatalf("aksi Master: %d %v", r.status, r.body)
			}
			close(g.release)
			wg.Wait()

			if pr.status != http.StatusConflict {
				t.Fatalf("tulisan basi pelaku: %d %v, want 409", pr.status, pr.body)
			}
			u := e.store.get(pelaku.ID)
			if u.TokenVersion != 1 || u.FullName == "loop" {
				t.Fatalf("tv = %d (want 1: naik sekali, dalam statement yang sama), nama = %q", u.TokenVersion, u.FullName)
			}
			tc.cek(t, e, u, oldHash)
			// Verifikasi runbook tetap benar: token lama ditolak.
			if r := e.do(t, http.MethodGet, "/api/admin/auth/me", pTok, nil); r.status != http.StatusUnauthorized {
				t.Fatalf("/me token lama: %d", r.status)
			}
		})
	}
}

// Celah kedua di jalur yang sama: RequireLiveSession lolos SEBELUM Master
// menonaktifkan, handler memuat baris SESUDAHNYA (is_active=false, tv baru),
// dan pelaku mengirim is_active:true eksplisit. Dulu akun hidup lagi; kini
// snapshot akun sendiri harus masih sesi yang sama → 401, tidak ada tulisan.
func TestPutaran4_SesiDicabutDiAntaraCekSesiDanMuatBaris(t *testing.T) {
	var g *gatedStore
	e := newAuthEnvWith(t, envOpts{wrap: func(f *fakeAdminStore) adminUserStore { g = newGatedStore(f); return g }})
	master, _ := e.addTOTPAdmin(t, "master@coreasia.id")
	pelaku := e.addAdmin(t, "bocor@coreasia.id", "super_admin")
	path := "/api/admin/users/" + pelaku.ID.String()
	pTok := e.tokens(t, pelaku, false).AccessToken
	mTok := e.tokens(t, master, true).AccessToken
	// FindByID ke-1 = RequireLiveSession, ke-2 = handler.
	g.findID, g.holdFindN = pelaku.ID, 2

	var wg sync.WaitGroup
	var pr reply
	wg.Add(1)
	go func() {
		defer wg.Done()
		pr = e.do(t, http.MethodPut, path, pTok, map[string]any{"is_active": true, "full_name": "Hidup Lagi"})
	}()
	<-g.arrived
	if r := e.do(t, http.MethodPut, path, mTok, map[string]any{"is_active": false}); r.status != http.StatusOK {
		t.Fatalf("Master menonaktifkan: %d %v", r.status, r.body)
	}
	close(g.release)
	wg.Wait()

	if pr.status != http.StatusUnauthorized {
		t.Fatalf("pelaku: %d %v, want 401", pr.status, pr.body)
	}
	if u := e.store.get(pelaku.ID); u.IsActive || u.FullName == "Hidup Lagi" {
		t.Fatalf("akun pelaku hidup lagi: is_active=%v nama=%q", u.IsActive, u.FullName)
	}
	if r := e.login(t, "bocor@coreasia.id"); r.status != http.StatusUnauthorized {
		t.Fatalf("login ulang pelaku: %d", r.status)
	}
}

// Tanpa gerbang: pelaku mengirim PUT diri paralel terus-menerus (latensi DB
// tiruan) sementara Master menonaktifkannya. Dulu penonaktifan dibatalkan di
// hampir setiap percobaan; kini tidak pernah.
func TestPutaran4_BalapanParalel_PenonaktifanBertahan(t *testing.T) {
	for round := 0; round < 15; round++ {
		e := newAuthEnv(t)
		e.store.findDelay = 300 * time.Microsecond
		master, _ := e.addTOTPAdmin(t, "master@coreasia.id")
		pelaku := e.addAdmin(t, "bocor@coreasia.id", "super_admin")
		path := "/api/admin/users/" + pelaku.ID.String()
		pTok := e.tokens(t, pelaku, false).AccessToken
		mTok := e.tokens(t, master, true).AccessToken

		var stop atomic.Bool
		var sent atomic.Int64
		var wg sync.WaitGroup
		for i := 0; i < 8; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				for !stop.Load() {
					e.do(t, http.MethodPut, path, pTok, map[string]any{"full_name": "Pelaku"})
					sent.Add(1)
				}
			}()
		}
		for sent.Load() < 16 {
			time.Sleep(100 * time.Microsecond)
		}
		if r := e.do(t, http.MethodPut, path, mTok, map[string]any{"is_active": false}); r.status != http.StatusOK {
			t.Fatalf("putaran %d: Master: %d %v", round, r.status, r.body)
		}
		time.Sleep(5 * time.Millisecond) // biarkan permintaan yang sedang jalan selesai menulis
		stop.Store(true)
		wg.Wait()
		if u := e.store.get(pelaku.ID); u.IsActive {
			t.Fatalf("putaran %d: penonaktifan dibatalkan (%d permintaan pelaku)", round, sent.Load())
		}
	}
}

// Tulisan Master yang basi juga ditolak (409), lalu berhasil setelah dimuat
// ulang: syaratnya berlaku untuk semua pemanggil, bukan hanya pelaku.
func TestPutaran4_TulisanMasterBasi409LaluUlangi(t *testing.T) {
	var g *gatedStore
	e := newAuthEnvWith(t, envOpts{wrap: func(f *fakeAdminStore) adminUserStore { g = newGatedStore(f); return g }})
	master, _ := e.addTOTPAdmin(t, "master@coreasia.id")
	staf := e.addAdmin(t, "staf@coreasia.id", "admin")
	path := "/api/admin/users/" + staf.ID.String()
	mTok := e.tokens(t, master, true).AccessToken
	sTok := e.tokens(t, staf, false).AccessToken
	g.holdUpdate = func(u *model.AdminUser) bool { return u.ID == staf.ID }

	var wg sync.WaitGroup
	var mr reply
	wg.Add(1)
	go func() {
		defer wg.Done()
		mr = e.do(t, http.MethodPut, path, mTok, map[string]any{"full_name": "Staf Baru"})
	}()
	<-g.arrived
	if r := e.do(t, http.MethodPost, "/api/admin/auth/logout-all", sTok, nil); r.status != http.StatusNoContent {
		t.Fatalf("logout-all staf: %d %v", r.status, r.body)
	}
	close(g.release)
	wg.Wait()
	if mr.status != http.StatusConflict || mr.errCode() != "CONFLICT" || !strings.Contains(errMessage(mr.body), "Muat ulang") {
		t.Fatalf("tulisan Master yang basi: %d %v, want 409", mr.status, mr.body)
	}
	if r := e.do(t, http.MethodPut, path, mTok, map[string]any{"full_name": "Staf Baru"}); r.status != http.StatusOK {
		t.Fatalf("ulangi: %d %v", r.status, r.body)
	}
	if u := e.store.get(staf.ID); u.FullName != "Staf Baru" || u.TokenVersion != 1 {
		t.Fatalf("nama=%q tv=%d", u.FullName, u.TokenVersion)
	}
}

func errMessage(body map[string]any) string {
	e, _ := body["errors"].(map[string]any)
	m, _ := e["message"].(string)
	return m
}

// ───────────────────────── temuan 2: kunci /login per akun ─────────────────────────

// serveEnv menjalankan app di 127.0.0.1 (peer loopback = proxy internal),
// supaya mw.ClientIP membaca X-Forwarded-For dari kanan seperti di belakang nginx.
func serveEnv(t *testing.T, app *fiber.App) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go func() { _ = app.Listener(ln, fiber.ListenConfig{DisableStartupMessage: true}) }()
	t.Cleanup(func() { _ = app.Shutdown() })
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if c, err := net.Dial("tcp", ln.Addr().String()); err == nil {
			c.Close()
			return "http://" + ln.Addr().String()
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("server uji tidak siap")
	return ""
}

func loginFrom(t *testing.T, base, ip, email, password string) int {
	t.Helper()
	b, _ := json.Marshal(map[string]string{"email": email, "password": password})
	req, _ := http.NewRequest(http.MethodPost, base+"/api/admin/auth/login", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Forwarded-For", ip)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	return resp.StatusCode
}

// PoC temuan 2: 10 sandi salah dari 2 IP mengunci login Master (sandi benar,
// IP bersih) selama penyerang mau, dan DEL operator tidak menolong. Kini asal
// yang pernah login benar untuk email itu tidak ikut dikunci; asal baru dan
// email lain tetap tertahan, dan batas per IP tetap berlaku.
func TestPutaran4_LoginPerAkun_AsalDikenalTidakTerkunci(t *testing.T) {
	e := newAuthEnvWith(t, envOpts{loginLimit: mw.NewIPRateLimiter(5, 15*time.Minute, false).MiddlewareBy(mw.ClientIPKey)})
	e.addAdmin(t, "master@coreasia.id", "super_admin")
	e.addAdmin(t, "lain@coreasia.id", "admin")
	base := serveEnv(t, e.app)
	const (
		rumah   = "203.0.113.10"
		lainIP  = "203.0.113.20"
		baru    = "192.0.2.50"
		salah   = "TebakanSalah-1"
		penyer1 = "198.51.100.1"
		penyer2 = "198.51.100.2"
	)
	attemptKey := auth.LoginAttemptKey("master@coreasia.id")

	if s := loginFrom(t, base, rumah, "master@coreasia.id", authTestPassword); s != http.StatusOK {
		t.Fatalf("login Master dari rumah: %d", s)
	}
	if s := loginFrom(t, base, lainIP, "lain@coreasia.id", authTestPassword); s != http.StatusOK {
		t.Fatalf("login admin lain: %d", s)
	}
	// Penyerang: 5 sandi salah dari masing-masing 2 IP → jatah per akun habis.
	for _, ip := range []string{penyer1, penyer2} {
		for i := 0; i < 5; i++ {
			if s := loginFrom(t, base, ip, "master@coreasia.id", salah); s != http.StatusUnauthorized {
				t.Fatalf("tebakan dari %s: %d", ip, s)
			}
		}
	}
	if n := e.loginLimiter.countKey(attemptKey); n != loginMaxFailures {
		t.Fatalf("hitungan per akun = %d, want %d", n, loginMaxFailures)
	}

	// Master dari asal yang dikenal: tetap bisa masuk, dan kuncinya tidak dibuka
	// untuk penyerang.
	for i := 0; i < 2; i++ {
		if s := loginFrom(t, base, rumah, "master@coreasia.id", authTestPassword); s != http.StatusOK {
			t.Fatalf("Master dari asal dikenal saat diserang (ke-%d): %d, want 200", i+1, s)
		}
	}
	if n := e.loginLimiter.countKey(attemptKey); n != loginMaxFailures {
		t.Fatalf("login dari asal dikenal tidak boleh mengosongkan hitungan: %d", n)
	}
	// Asal baru tetap tertahan, sandi benar sekalipun (tidak dievaluasi).
	if s := loginFrom(t, base, baru, "master@coreasia.id", authTestPassword); s != http.StatusTooManyRequests {
		t.Fatalf("asal baru: %d, want 429", s)
	}
	// Asal yang dikenal untuk email LAIN tidak memberi pengecualian.
	if s := loginFrom(t, base, lainIP, "master@coreasia.id", salah); s != http.StatusTooManyRequests {
		t.Fatalf("asal dikenal milik email lain: %d, want 429", s)
	}
	// Tebakan dari asal dikenal dievaluasi, tetapi tetap dibatasi per IP (5 per
	// 15 menit; asal ini sudah memakai 3).
	for i := 0; i < 2; i++ {
		if s := loginFrom(t, base, rumah, "master@coreasia.id", salah); s != http.StatusUnauthorized {
			t.Fatalf("sandi salah dari asal dikenal ke-%d: %d, want 401", i+1, s)
		}
	}
	if s := loginFrom(t, base, rumah, "master@coreasia.id", authTestPassword); s != http.StatusTooManyRequests {
		t.Fatalf("batas per IP untuk asal dikenal: %d, want 429", s)
	}
}

// Redis sungguhan (opt-in; DB 15): kunci asal diberi TTL, terpisah per email,
// dan uji ujung ke ujung seperti PoC (penyerang dari 2 IP, Master dari asal
// yang dikenal). Kunci dihapus sesudahnya.
func TestPutaran4_LoginPerAkun_AsalDikenalRedisSungguhan(t *testing.T) {
	addr := testenv.RedisAddr(t)
	rdb := redis.NewClient(&redis.Options{Addr: addr, DB: 15})
	defer rdb.Close()
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		testenv.Unavailable(t, "redis %s tidak terjangkau: %v", addr, err)
	}
	lim := auth.NewRedisLoginLimiter(rdb, loginMaxFailures, loginFailureWindow, loginOriginTTL)
	email := "uji-" + uuid.NewString() + "@contoh.invalid"
	origin := auth.LoginOriginKey(email, "203.0.113.10")
	defer rdb.Del(ctx, "gateway:admin_login_asal:"+origin, "gateway:admin_login_asal:"+auth.LoginOriginKey(email, "203.0.113.11"),
		"gateway:admin_login_gagal:"+auth.LoginAttemptKey(email))

	if ok, err := lim.KnownOrigin(ctx, origin); err != nil || ok {
		t.Fatalf("asal baru: %v %v", ok, err)
	}
	if err := lim.RememberOrigin(ctx, origin); err != nil {
		t.Fatal(err)
	}
	if ok, err := lim.KnownOrigin(ctx, origin); err != nil || !ok {
		t.Fatalf("asal yang dicatat: %v %v", ok, err)
	}
	if ttl := rdb.PTTL(ctx, "gateway:admin_login_asal:"+origin).Val(); ttl <= 0 || ttl > loginOriginTTL {
		t.Fatalf("TTL asal = %v", ttl)
	}
	if ok, _ := lim.KnownOrigin(ctx, auth.LoginOriginKey("lain-"+email, "203.0.113.10")); ok {
		t.Fatal("asal dikenal tidak boleh berlaku untuk email lain")
	}
	if auth.LoginOriginKey(strings.ToUpper(email)+" ", "203.0.113.10") != origin {
		t.Fatal("sidik asal harus mengabaikan huruf besar dan spasi tepi")
	}

	// Ujung ke ujung dengan pembatas Redis ini.
	e := newAuthEnv(t)
	e.addAdmin(t, email, "super_admin")
	h := &AuthHandler{userRepo: e.store, auditLog: e.audit, jwt: e.jwt, totp: e.cipher, attempts: e.limiter,
		loginAttempts: lim, now: func() time.Time { return e.clock }}
	app := fiber.New(fiber.Config{ErrorHandler: globalErrorHandler})
	registerAdminAuthRoutes(app.Group("/api"), adminRoutes{auth: h, requireAuth: mw.AuthMiddleware(e.jwt), loginLimit: passThrough, verifyLimit: passThrough})
	base := serveEnv(t, app)
	for i := 0; i < loginMaxFailures; i++ {
		ip := []string{"198.51.100.1", "198.51.100.2"}[i%2]
		if s := loginFrom(t, base, ip, email, "TebakanSalah-1"); s != http.StatusUnauthorized {
			t.Fatalf("tebakan ke-%d: %d", i+1, s)
		}
	}
	if s := loginFrom(t, base, "203.0.113.11", email, authTestPassword); s != http.StatusTooManyRequests {
		t.Fatalf("asal baru saat terkunci: %d, want 429", s)
	}
	if s := loginFrom(t, base, "203.0.113.10", email, authTestPassword); s != http.StatusOK {
		t.Fatalf("Master dari asal dikenal saat terkunci: %d, want 200", s)
	}
}

// Redis mati: pemeriksaan asal gagal → jatuh ke jalur biasa (gagal terbuka ke
// batas per IP, sama seperti sebelumnya).
func TestPutaran4_LoginPerAkun_AsalSaatRedisMati(t *testing.T) {
	e := newAuthEnv(t)
	e.addAdmin(t, "a@coreasia.id", "admin")
	e.loginLimiter.down = true
	if r := e.login(t, "a@coreasia.id"); r.status != http.StatusOK {
		t.Fatalf("login saat Redis mati: %d %v", r.status, r.body)
	}
}

// ───────────────────────── temuan 3: ganti sandi sendiri, console lama ─────────────────────────

// Console yang sedang tayang (landing HEAD) mengirim PUT /users/<diri>
// {password} tanpa sandi lama. Selama masa transisi (belum ada admin ber-TOTP)
// itu tetap berhasil, seperti sebelum Fase 0c; sesi lama dicabut.
func TestPutaran4_GantiSandiSendiri_MasaTransisiConsoleLama(t *testing.T) {
	e := newAuthEnv(t)
	master := e.addAdmin(t, "master@coreasia.id", "super_admin")
	path := "/api/admin/users/" + master.ID.String()
	tok := e.tokens(t, master, false).AccessToken

	if r := e.do(t, http.MethodGet, "/api/admin/auth/me", tok, nil); r.status != http.StatusOK {
		t.Fatalf("/me: %d", r.status)
	}
	if r := e.do(t, http.MethodPut, path, tok, map[string]any{"email": "master@coreasia.id", "full_name": "Master", "role": "super_admin"}); r.status != http.StatusOK {
		t.Fatalf("form ubah diri (console lama): %d %v", r.status, r.body)
	}
	// current_password yang dikirim tetap diperiksa.
	if r := e.do(t, http.MethodPut, path, tok, map[string]any{"password": "SandiBaru-999!", "current_password": "Tebakan-1"}); r.errCode() != "PASSWORD_INVALID" {
		t.Fatalf("sandi lama salah di masa transisi: %d %s", r.status, r.errCode())
	}
	r := e.do(t, http.MethodPut, path, tok, map[string]any{"password": "SandiBaru-999!"})
	if r.status != http.StatusOK {
		t.Fatalf("ganti sandi sendiri dari console lama (transisi): %d %v", r.status, r.body)
	}
	if r := e.do(t, http.MethodGet, "/api/admin/auth/me", tok, nil); r.status != http.StatusUnauthorized {
		t.Fatalf("token lama setelah ganti sandi: %d, want 401", r.status)
	}
	if r := e.loginWith(t, "master@coreasia.id", "SandiBaru-999!"); r.status != http.StatusOK {
		t.Fatalf("login dengan sandi baru: %d", r.status)
	}
}

// Begitu ada satu admin ber-TOTP, syarat sandi lama berlaku (rantai putaran 3
// tetap tertutup), dengan pesan tanpa nama field.
func TestPutaran4_GantiSandiSendiri_WajibSetelahTOTPPertama(t *testing.T) {
	e := newAuthEnv(t)
	lemah := e.addAdmin(t, "lemah@coreasia.id", "super_admin")
	e.addTOTPAdmin(t, "master@coreasia.id")
	r := e.do(t, http.MethodPut, "/api/admin/users/"+lemah.ID.String(), e.tokens(t, lemah, false).AccessToken, map[string]any{"password": "SandiPelaku-888!"})
	if r.status != http.StatusBadRequest || r.errCode() != "CURRENT_PASSWORD_REQUIRED" {
		t.Fatalf("setelah TOTP pertama: %d %v", r.status, r.body)
	}
	if m := errMessage(r.body); strings.Contains(m, "current_password") || m == "" {
		t.Fatalf("pesan untuk manusia tidak boleh menyebut nama field: %q", m)
	}
}

// Galat DB saat memeriksa masa transisi = gagal tertutup (500, sandi tetap).
type anyTOTPErrStore struct{ *fakeAdminStore }

func (anyTOTPErrStore) AnyTOTPEnabled(context.Context) (bool, error) {
	return false, errors.New("koneksi DB putus")
}

func TestPutaran4_GantiSandiSendiri_GalatDBGagalTertutup(t *testing.T) {
	e := newAuthEnvWith(t, envOpts{wrap: func(f *fakeAdminStore) adminUserStore { return anyTOTPErrStore{f} }})
	u := e.addAdmin(t, "master@coreasia.id", "super_admin")
	hash := e.store.get(u.ID).PasswordHash
	r := e.do(t, http.MethodPut, "/api/admin/users/"+u.ID.String(), e.tokens(t, u, false).AccessToken, map[string]any{"password": "SandiBaru-999!"})
	if r.status != http.StatusInternalServerError {
		t.Fatalf("galat DB: %d, want 500", r.status)
	}
	if e.store.get(u.ID).PasswordHash != hash {
		t.Fatal("sandi tidak boleh berubah")
	}
}
