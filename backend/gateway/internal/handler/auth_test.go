package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auditip"
	"github.com/coreasia/gateway/internal/auth"
	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

// ───────────────────────── repositori admin in-memory ─────────────────────────

// fakeAdminStore meniru semantik SQL AdminUserRepo (termasuk syarat WHERE pada
// operasi TOTP) di memori. FindBy* mengembalikan salinan, seperti DB.
type fakeAdminStore struct {
	mu         sync.Mutex
	users      map[uuid.UUID]*model.AdminUser
	lastLogins map[uuid.UUID]int
	long       map[uuid.UUID]*fakeLong // lapis panjang faktor kedua (LongAttemptStore)
	// findDelay meniru latensi DB di FindByID (memperlebar celah balapan di
	// uji paralel).
	findDelay time.Duration
}

func newFakeAdminStore() *fakeAdminStore {
	return &fakeAdminStore{users: map[uuid.UUID]*model.AdminUser{}, lastLogins: map[uuid.UUID]int{}}
}

func (f *fakeAdminStore) put(u *model.AdminUser) *model.AdminUser {
	f.mu.Lock()
	defer f.mu.Unlock()
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}
	f.users[u.ID] = u
	return u
}

func (f *fakeAdminStore) get(id uuid.UUID) model.AdminUser {
	f.mu.Lock()
	defer f.mu.Unlock()
	return *f.users[id]
}

func (f *fakeAdminStore) totpOn(id uuid.UUID) bool {
	u := f.get(id)
	return u.TOTPEnabled()
}

// FindByEmail: tanpa peka huruf dan spasi tepi; yang persis sama didahulukan
// (seperti ORDER BY di AdminUserRepo.FindByEmail).
func (f *fakeAdminStore) FindByEmail(_ context.Context, email string) (*model.AdminUser, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var found *model.AdminUser
	for _, u := range f.users {
		if model.NormalizeEmail(u.Email) != model.NormalizeEmail(email) {
			continue
		}
		if found == nil || u.Email == email {
			found = u
		}
	}
	if found == nil {
		return nil, nil
	}
	cp := *found
	return &cp, nil
}

func (f *fakeAdminStore) FindByID(_ context.Context, id uuid.UUID) (*model.AdminUser, error) {
	if f.findDelay > 0 {
		time.Sleep(f.findDelay)
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	if u, ok := f.users[id]; ok {
		cp := *u
		return &cp, nil
	}
	return nil, nil
}

func (f *fakeAdminStore) FindAll(context.Context, int, int) ([]model.AdminUser, int, error) {
	return nil, 0, nil
}
func (f *fakeAdminStore) Create(_ context.Context, u *model.AdminUser) error {
	f.put(u)
	return nil
}

// Update: WHERE id AND token_version = u.TokenVersion; revoke menaikkan
// token_version di "statement" yang sama (di bawah mutex yang sama).
func (f *fakeAdminStore) Update(_ context.Context, u *model.AdminUser, revoke bool) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	cur, ok := f.users[u.ID]
	if !ok || cur.TokenVersion != u.TokenVersion {
		return false, nil
	}
	cur.Email, cur.FullName, cur.Role, cur.IsActive, cur.PasswordHash = u.Email, u.FullName, u.Role, u.IsActive, u.PasswordHash
	if revoke {
		cur.TokenVersion++
	}
	u.TokenVersion = cur.TokenVersion
	return true, nil
}

func (f *fakeAdminStore) Delete(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.users, id)
	return nil
}

func (f *fakeAdminStore) UpdateLastLogin(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.lastLogins[id]++
	return nil
}

func (f *fakeAdminStore) BumpTokenVersion(_ context.Context, id uuid.UUID) (int, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u, ok := f.users[id]
	if !ok {
		return 0, errors.New("no rows")
	}
	u.TokenVersion++
	return u.TokenVersion, nil
}

func (f *fakeAdminStore) SetTOTPPending(_ context.Context, id uuid.UUID, enc string) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u := f.users[id]
	if u == nil || u.TOTPEnabledAt != nil {
		return false, nil
	}
	u.TOTPPendingEnc = &enc
	return true, nil
}

func (f *fakeAdminStore) EnableTOTP(_ context.Context, id uuid.UUID, pendingEnc string, step int64) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u := f.users[id]
	if u == nil || u.TOTPEnabledAt != nil || u.TOTPPendingEnc == nil || *u.TOTPPendingEnc != pendingEnc {
		return false, nil
	}
	now := time.Now()
	u.TOTPSecretEnc, u.TOTPPendingEnc, u.TOTPEnabledAt, u.TOTPLastStep = u.TOTPPendingEnc, nil, &now, &step
	u.TokenVersion++
	return true, nil
}

func (f *fakeAdminStore) DisableTOTP(_ context.Context, id uuid.UUID, step int64) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u := f.users[id]
	if u == nil || u.TOTPEnabledAt == nil || (u.TOTPLastStep != nil && *u.TOTPLastStep >= step) {
		return false, nil
	}
	u.TOTPSecretEnc, u.TOTPPendingEnc, u.TOTPEnabledAt, u.TOTPLastStep = nil, nil, nil, nil
	u.TokenVersion++
	return true, nil
}

func (f *fakeAdminStore) ResetTOTP(_ context.Context, id uuid.UUID) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u := f.users[id]
	if u == nil {
		return false, nil
	}
	u.TOTPSecretEnc, u.TOTPPendingEnc, u.TOTPEnabledAt, u.TOTPLastStep = nil, nil, nil, nil
	u.TokenVersion++
	return true, nil
}

func (f *fakeAdminStore) AnyTOTPEnabled(context.Context) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, u := range f.users {
		if u.TOTPEnabled() {
			return true, nil
		}
	}
	return false, nil
}

func (f *fakeAdminStore) ConsumeTOTPStep(_ context.Context, id uuid.UUID, step int64) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u := f.users[id]
	if u == nil || u.TOTPEnabledAt == nil || (u.TOTPLastStep != nil && *u.TOTPLastStep >= step) {
		return false, nil
	}
	u.TOTPLastStep = &step
	return true, nil
}

// Lapis panjang jatah faktor kedua (auth.LongAttemptStore), meniru SQL
// AdminUserRepo di memori: jendela tetap dari kegagalan pertama, yang lewat
// dibaca nol. Dipakai bersama auth.RedisTOTPLimiter di uji Redis sungguhan.
type fakeLong struct {
	n     int64
	start time.Time
}

func (f *fakeAdminStore) longOf(id uuid.UUID, window time.Duration) (*fakeLong, error) {
	if f.long == nil {
		f.long = map[uuid.UUID]*fakeLong{}
	}
	if _, ok := f.users[id]; !ok {
		return nil, errors.New("admin tidak ada")
	}
	l := f.long[id]
	if l == nil {
		l = &fakeLong{}
		f.long[id] = l
	}
	if !l.start.IsZero() && !time.Now().Before(l.start.Add(window)) {
		l.n, l.start = 0, time.Time{}
	}
	return l, nil
}

func (f *fakeAdminStore) LongFailures(_ context.Context, id uuid.UUID, window time.Duration) (int64, time.Duration, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	l, err := f.longOf(id, window)
	if err != nil {
		return 0, 0, err
	}
	if l.start.IsZero() {
		return l.n, 0, nil
	}
	return l.n, time.Until(l.start.Add(window)), nil
}

func (f *fakeAdminStore) ReserveLongFailure(_ context.Context, id uuid.UUID, max int64, window time.Duration) (bool, int64, time.Duration, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	l, err := f.longOf(id, window)
	if err != nil || l.n >= max {
		return false, 0, 0, nil
	}
	if l.start.IsZero() {
		l.start = time.Now()
	}
	l.n++
	return true, l.n, time.Until(l.start.Add(window)), nil
}

func (f *fakeAdminStore) ReleaseLongFailure(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if l := f.long[id]; l != nil && l.n > 0 {
		l.n--
		if l.n == 0 {
			l.start = time.Time{}
		}
	}
	return nil
}

func (f *fakeAdminStore) ClearLongFailures(_ context.Context, id uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.long, id)
	return nil
}

func (f *fakeAdminStore) ImportLongFailures(_ context.Context, id uuid.UUID, n int64, remaining, window time.Duration) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	l, err := f.longOf(id, window)
	if err != nil {
		return err
	}
	if l.start.IsZero() {
		l.n, l.start = n, time.Now().Add(remaining-window)
	} else if n > l.n {
		l.n = n
	}
	return nil
}

// ───────────────────────── pembatas & audit tiruan ─────────────────────────

// fakeLimiter meniru auth.RedisTOTPLimiter (Take/Reset/Clear, dua lapis) dan
// auth.RedisAttemptLimiter (TakeKey/ResetKey, satu lapis): jatah dipesan secara
// atomik di bawah mutex, seperti skrip Lua di Redis. Dipakai untuk batas TOTP
// per admin (kunci = id) dan batas /login per akun (kunci = sidik email).
type fakeLimiter struct {
	mu      sync.Mutex
	counts  map[string]int64 // jendela pendek
	long    map[string]int64 // jendela panjang (hanya Take/Reset/Clear)
	max     int64
	maxLong int64           // 0 = tanpa lapis panjang
	down    bool            // meniru Redis mati, READONLY, atau OOM: pemesanan gagal
	origins map[string]bool // asal /login yang dikenal (hanya pembatas login)
}

func newFakeLimiter() *fakeLimiter {
	l := newFakeLimiterMax(totpMaxFailures)
	l.maxLong = totpMaxFailuresLong
	return l
}

func newFakeLimiterMax(max int64) *fakeLimiter {
	return &fakeLimiter{counts: map[string]int64{}, long: map[string]int64{}, max: max}
}

func (l *fakeLimiter) Take(_ context.Context, id uuid.UUID) (auth.AttemptResult, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.down {
		return auth.AttemptResult{}, errors.New("READONLY You can't write against a read only replica.")
	}
	key := id.String()
	if l.maxLong > 0 && l.long[key] >= l.maxLong {
		return auth.AttemptResult{Locked: true, Long: l.long[key], Retry: 29 * 24 * time.Hour}, nil
	}
	l.counts[key]++
	n := l.counts[key]
	if n > l.max {
		return auth.AttemptResult{N: n, Long: l.long[key], Retry: 14 * time.Minute}, nil
	}
	l.long[key]++
	return auth.AttemptResult{Allowed: true, N: n, Long: l.long[key], Retry: 14 * time.Minute}, nil
}

// Clear: kedua lapis dihapus (pemulihan oleh super admin).
func (l *fakeLimiter) Clear(_ context.Context, id uuid.UUID) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.counts, id.String())
	delete(l.long, id.String())
	return nil
}

// expireWindow meniru berakhirnya jendela pendek (TTL Redis habis).
func (l *fakeLimiter) expireWindow(id uuid.UUID) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.counts, id.String())
}

func (l *fakeLimiter) longCount(id uuid.UUID) int64 {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.long[id.String()]
}

func (l *fakeLimiter) TakeKey(_ context.Context, key string) (bool, int64, time.Duration, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.down {
		return false, 0, 0, errors.New("READONLY You can't write against a read only replica.")
	}
	l.counts[key]++
	return l.counts[key] <= l.max, l.counts[key], 14 * time.Minute, nil
}

// Reset: berhasil → jendela pendek kosong, jatah panjang percobaan itu kembali.
func (l *fakeLimiter) Reset(_ context.Context, id uuid.UUID) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	key := id.String()
	delete(l.counts, key)
	if l.long[key] > 0 {
		l.long[key]--
	}
	return nil
}

// Refund: galat server → satu jatah pendek dan satu jatah panjang kembali;
// kegagalan lain di jendela pendek tetap terhitung.
func (l *fakeLimiter) Refund(_ context.Context, id uuid.UUID) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	key := id.String()
	if l.counts[key] > 0 {
		l.counts[key]--
	}
	if l.long[key] > 0 {
		l.long[key]--
	}
	return nil
}

func (l *fakeLimiter) ResetKey(_ context.Context, key string) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.counts, key)
	return nil
}

// KnownOrigin/RememberOrigin meniru asal /login yang dikenal (Redis SET/EXISTS).
func (l *fakeLimiter) KnownOrigin(_ context.Context, key string) (bool, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.down {
		return false, errors.New("READONLY You can't write against a read only replica.")
	}
	return l.origins[key], nil
}

func (l *fakeLimiter) RememberOrigin(_ context.Context, key string) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.down {
		return errors.New("READONLY You can't write against a read only replica.")
	}
	if l.origins == nil {
		l.origins = map[string]bool{}
	}
	l.origins[key] = true
	return nil
}

func (l *fakeLimiter) count(id uuid.UUID) int64 {
	return l.countKey(id.String())
}

func (l *fakeLimiter) countKey(key string) int64 {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.counts[key]
}

type recordingAudit struct {
	mu       sync.Mutex
	actions  []string
	descs    []string // sejajar dengan actions ("" bila tanpa deskripsi)
	ips      []string // sejajar: IP yang dilihat gateway (argumen ip)
	reported []string // sejajar: IP yang dilaporkan BFF (auditip dari context)
}

func (a *recordingAudit) LogAction(ctx context.Context, _ *uuid.UUID, _ *string, action, _ string, _ *string, desc *string, ip string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.actions = append(a.actions, action)
	d := ""
	if desc != nil {
		d = *desc
	}
	a.descs = append(a.descs, d)
	a.ips = append(a.ips, ip)
	a.reported = append(a.reported, auditip.From(ctx))
}

// lastOf: IP gateway dan IP yang dilaporkan BFF untuk baris terakhir aksi ini.
func (a *recordingAudit) lastOf(action string) (ip, reported string, ok bool) {
	a.mu.Lock()
	defer a.mu.Unlock()
	for i := len(a.actions) - 1; i >= 0; i-- {
		if a.actions[i] == action {
			return a.ips[i], a.reported[i], true
		}
	}
	return "", "", false
}

// count: berapa kali aksi ini dicatat.
func (a *recordingAudit) count(action string) int {
	a.mu.Lock()
	defer a.mu.Unlock()
	n := 0
	for _, x := range a.actions {
		if x == action {
			n++
		}
	}
	return n
}

// descsOf: deskripsi semua baris untuk aksi ini.
func (a *recordingAudit) descsOf(action string) []string {
	a.mu.Lock()
	defer a.mu.Unlock()
	var out []string
	for i, x := range a.actions {
		if x == action {
			out = append(out, a.descs[i])
		}
	}
	return out
}

func (a *recordingAudit) has(action string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	for _, x := range a.actions {
		if x == action {
			return true
		}
	}
	return false
}

// ───────────────────────── rakitan app uji ─────────────────────────

const (
	authTestSecret   = "rahasia-uji-handler-auth"
	authTestIssuer   = "coreasia-gateway"
	authTestPassword = "SandiUji-123" // hanya untuk hash bcrypt di repositori in-memory
)

type authEnv struct {
	app     *fiber.App
	store   *fakeAdminStore
	jwt     *auth.JWTProvider
	cipher  *auth.TOTPCipher
	limiter *fakeLimiter
	// loginLimiter: batas sandi /login per akun (loginMaxFailures).
	loginLimiter *fakeLimiter
	audit        *recordingAudit
	clock        time.Time // jam untuk TOTP (h.now); JWT memakai jam sungguhan
	// evals menghitung kode TOTP yang benar-benar dievaluasi: h.now hanya
	// dipanggil tepat sebelum auth.VerifyTOTP.
	evals atomic.Int64
	// keys: handler /api-keys tiruan (menghitung panggilan yang lolos middleware).
	keys *fakeAPIKeys
}

// fakeAPIKeys menggantikan *APIKeyHandler di rute /api/admin/api-keys/**:
// setiap handler hanya mencatat bahwa ia terpanggil lalu menjawab 200.
type fakeAPIKeys struct{ calls atomic.Int64 }

func (f *fakeAPIKeys) hit(c fiber.Ctx) error {
	f.calls.Add(1)
	return c.JSON(fiber.Map{"data": fiber.Map{"ok": true}})
}
func (f *fakeAPIKeys) List(c fiber.Ctx) error    { return f.hit(c) }
func (f *fakeAPIKeys) GetByID(c fiber.Ctx) error { return f.hit(c) }
func (f *fakeAPIKeys) CopyKey(c fiber.Ctx) error { return f.hit(c) }
func (f *fakeAPIKeys) Create(c fiber.Ctx) error  { return f.hit(c) }
func (f *fakeAPIKeys) Update(c fiber.Ctx) error  { return f.hit(c) }
func (f *fakeAPIKeys) Delete(c fiber.Ctx) error  { return f.hit(c) }

func passThrough(c fiber.Ctx) error { return c.Next() }

type envOpts struct {
	attempts totpAttemptLimiter // nil = fakeLimiter
	// attemptsFor: pembatas yang butuh repositori in-memory env ini (mis.
	// auth.RedisTOTPLimiter dengan lapis panjang di fakeAdminStore).
	attemptsFor func(*fakeAdminStore) totpAttemptLimiter
	verifyLimit fiber.Handler // nil = tanpa pembatas IP
	loginLimit  fiber.Handler // nil = tanpa pembatas IP
	// wrap membungkus repositori in-memory (mis. menahan satu panggilan untuk
	// uji balapan). nil = env.store apa adanya.
	wrap func(*fakeAdminStore) adminUserStore
}

// newAuthEnv merakit rute lewat fungsi yang sama dengan server.go
// (registerAdminAuthRoutes + registerAdminUserRoutes + RequireLiveSession).
// Pembatas IP dilewati kecuali diminta, supaya uji per admin tidak tertutup
// oleh batas per IP.
func newAuthEnv(t *testing.T) *authEnv {
	t.Helper()
	return newAuthEnvWith(t, envOpts{})
}

func newAuthEnvWith(t *testing.T, o envOpts) *authEnv {
	t.Helper()
	cipher, err := auth.NewTOTPCipher(authTestSecret)
	if err != nil {
		t.Fatal(err)
	}
	env := &authEnv{
		store:        newFakeAdminStore(),
		jwt:          auth.NewJWTProvider(authTestSecret, time.Hour, 720*time.Hour, authTestIssuer),
		cipher:       cipher,
		limiter:      newFakeLimiter(),
		loginLimiter: newFakeLimiterMax(loginMaxFailures),
		audit:        &recordingAudit{},
		clock:        time.Unix(1_900_000_005, 0),
	}
	var attempts totpAttemptLimiter = env.limiter
	if o.attempts != nil {
		attempts = o.attempts
	}
	if o.attemptsFor != nil {
		attempts = o.attemptsFor(env.store)
	}
	verifyLimit := o.verifyLimit
	if verifyLimit == nil {
		verifyLimit = passThrough
	}
	loginLimit := o.loginLimit
	if loginLimit == nil {
		loginLimit = passThrough
	}
	var store adminUserStore = env.store
	if o.wrap != nil {
		store = o.wrap(env.store)
	}
	h := &AuthHandler{
		userRepo:      store,
		auditLog:      env.audit,
		jwt:           env.jwt,
		totp:          env.cipher,
		attempts:      attempts,
		loginAttempts: env.loginLimiter,
		now: func() time.Time {
			env.evals.Add(1)
			return env.clock
		},
	}
	uh := &AdminUserHandler{userRepo: store, auditLog: env.audit, attempts: attempts}

	app := fiber.New(fiber.Config{ErrorHandler: globalErrorHandler})
	api := app.Group("/api")
	admin := registerAdminAuthRoutes(api, adminRoutes{
		auth:        h,
		requireAuth: mw.AuthMiddleware(env.jwt),
		loginLimit:  loginLimit,
		verifyLimit: verifyLimit,
	})
	registerAdminUserRoutes(admin, uh, mw.RequireLiveSession(store))
	env.keys = &fakeAPIKeys{}
	registerAPIKeyRoutes(admin, env.keys, mw.RequireLiveSession(store))
	env.app = app
	return env
}

func (e *authEnv) addAdmin(t *testing.T, email, role string) *model.AdminUser {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte(authTestPassword), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	return e.store.put(&model.AdminUser{Email: email, PasswordHash: string(hash), FullName: "Admin Uji", Role: role, IsActive: true})
}

// addTOTPAdmin: super admin lama dengan TOTP aktif sejak lama (melewati masa
// tenggang mfaEnrollmentGrace); mengembalikan rahasia base32-nya.
func (e *authEnv) addTOTPAdmin(t *testing.T, email string) (*model.AdminUser, string) {
	t.Helper()
	return e.addTOTPAdminSince(t, email, 30*24*time.Hour)
}

// addTOTPAdminSince: seperti addTOTPAdmin, dengan TOTP aktif sejak `age` lalu
// (akun dibuat dua kali lebih lama).
func (e *authEnv) addTOTPAdminSince(t *testing.T, email string, age time.Duration) (*model.AdminUser, string) {
	t.Helper()
	u := e.addAdmin(t, email, "super_admin")
	secret, _, err := auth.NewTOTPKey(email)
	if err != nil {
		t.Fatal(err)
	}
	enc, err := e.cipher.Seal(u.ID, secret)
	if err != nil {
		t.Fatal(err)
	}
	enabled := time.Now().Add(-age)
	e.store.mu.Lock()
	u.TOTPSecretEnc, u.TOTPEnabledAt, u.CreatedAt = &enc, &enabled, time.Now().Add(-2*age)
	e.store.mu.Unlock()
	return u, secret
}

func (e *authEnv) code(t *testing.T, secret string) string {
	t.Helper()
	c, err := totp.GenerateCode(secret, e.clock)
	if err != nil {
		t.Fatal(err)
	}
	return c
}

// wrongCode: 6 digit yang pasti bukan kode sah di jendela ±1 langkah.
func (e *authEnv) wrongCode(t *testing.T, secret string) string {
	t.Helper()
	valid := map[string]bool{}
	for _, d := range []time.Duration{-30 * time.Second, 0, 30 * time.Second} {
		c, _ := totp.GenerateCode(secret, e.clock.Add(d))
		valid[c] = true
	}
	for i := 0; i < 10; i++ {
		w := strings.Repeat(string(rune('0'+i)), 6)
		if !valid[w] {
			return w
		}
	}
	t.Fatal("tidak menemukan kode salah")
	return ""
}

func (e *authEnv) tokens(t *testing.T, u *model.AdminUser, mfa bool) *auth.TokenPair {
	t.Helper()
	cur := e.store.get(u.ID)
	p, err := e.jwt.GenerateTokenPair(cur.ID, cur.Email, cur.Role, cur.FullName, mfa, cur.TokenVersion)
	if err != nil {
		t.Fatal(err)
	}
	return p
}

type reply struct {
	status  int
	body    map[string]any
	cookies []*http.Cookie
	header  http.Header
}

func (e *authEnv) do(t *testing.T, method, path, bearer string, body any) reply {
	t.Helper()
	var rdr io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		rdr = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, rdr)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	resp, err := e.app.Test(req, fiber.TestConfig{Timeout: 5 * time.Second})
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	var parsed map[string]any
	_ = json.NewDecoder(resp.Body).Decode(&parsed)
	return reply{status: resp.StatusCode, body: parsed, cookies: resp.Cookies(), header: resp.Header}
}

func (r reply) data() map[string]any {
	d, _ := r.body["data"].(map[string]any)
	return d
}

func (r reply) errCode() string { return errCode(r.body) }

func (r reply) cookie(name string) *http.Cookie {
	for _, c := range r.cookies {
		if c.Name == name {
			return c
		}
	}
	return nil
}

func keysOf(m map[string]any) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

func sameKeys(t *testing.T, what string, m map[string]any, want ...string) {
	t.Helper()
	sort.Strings(want)
	got := keysOf(m)
	if strings.Join(got, ",") != strings.Join(want, ",") {
		t.Fatalf("%s: kunci = %v, want %v", what, got, want)
	}
}

func (e *authEnv) login(t *testing.T, email string) reply {
	t.Helper()
	return e.do(t, http.MethodPost, "/api/admin/auth/login", "", map[string]string{"email": email, "password": authTestPassword})
}

// ───────────────────────── login ─────────────────────────

// Landing yang sedang tayang membaca jawaban login apa adanya: untuk admin
// tanpa TOTP bentuknya tidak boleh berubah sedikit pun.
func TestLogin_TanpaTOTP_BentukJawabanLama(t *testing.T) {
	e := newAuthEnv(t)
	u := e.addAdmin(t, "biasa@coreasia.id", "admin")

	r := e.login(t, "biasa@coreasia.id")
	if r.status != http.StatusOK {
		t.Fatalf("status = %d, body = %v", r.status, r.body)
	}
	sameKeys(t, "jawaban", r.body, "data")
	sameKeys(t, "data", r.data(), "access_token", "refresh_token", "expires_at", "user")
	user, _ := r.data()["user"].(map[string]any)
	sameKeys(t, "data.user", user, "id", "email", "full_name", "role", "is_active", "last_login_at", "created_at")
	if user["email"] != "biasa@coreasia.id" || user["role"] != "admin" || user["is_active"] != true {
		t.Fatalf("data.user salah: %v", user)
	}
	if _, err := time.Parse(time.RFC3339, r.data()["expires_at"].(string)); err != nil {
		t.Fatalf("expires_at bukan RFC3339: %v", r.data()["expires_at"])
	}

	acc, err := e.jwt.ValidateAccess(r.data()["access_token"].(string))
	if err != nil || acc.MFA || acc.TV != 0 || acc.UserID != u.ID {
		t.Fatalf("access token: %+v, %v", acc, err)
	}
	if ref, err := e.jwt.ValidateRefresh(r.data()["refresh_token"].(string)); err != nil || ref.MFA {
		t.Fatalf("refresh token: %+v, %v", ref, err)
	}
	for _, name := range []string{"auth_admin_token", "refresh_admin_token"} {
		c := r.cookie(name)
		if c == nil || c.Value == "" || !c.HttpOnly || !c.Secure {
			t.Fatalf("cookie %s tidak terpasang seperti sebelumnya: %+v", name, c)
		}
	}
	if e.store.lastLogins[u.ID] != 1 || !e.audit.has("login") {
		t.Fatal("login harus mencatat last_login dan audit")
	}
}

func TestLogin_SandiSalahDanNonaktif(t *testing.T) {
	e := newAuthEnv(t)
	u := e.addAdmin(t, "a@coreasia.id", "admin")
	r := e.do(t, http.MethodPost, "/api/admin/auth/login", "", map[string]string{"email": "a@coreasia.id", "password": "BukanSandi-1"})
	if r.status != http.StatusUnauthorized {
		t.Fatalf("sandi salah: status = %d", r.status)
	}
	u.IsActive = false
	if r := e.login(t, "a@coreasia.id"); r.status != http.StatusUnauthorized {
		t.Fatalf("admin nonaktif: status = %d", r.status)
	}
}

func TestLogin_DenganTOTP_TantanganTanpaToken(t *testing.T) {
	e := newAuthEnv(t)
	u, _ := e.addTOTPAdmin(t, "mfa@coreasia.id")

	r := e.login(t, "mfa@coreasia.id")
	if r.status != http.StatusOK {
		t.Fatalf("status = %d, body = %v", r.status, r.body)
	}
	sameKeys(t, "data", r.data(), "mfa_required", "challenge")
	if r.data()["mfa_required"] != true {
		t.Fatal("mfa_required harus true")
	}
	if len(r.cookies) != 0 {
		t.Fatalf("tidak boleh ada cookie sebelum TOTP: %v", r.cookies)
	}
	ch := r.data()["challenge"].(string)
	if cl, err := e.jwt.ValidateMFAChallenge(ch); err != nil || cl.UserID != u.ID {
		t.Fatalf("challenge harus typ=mfa milik admin: %+v %v", cl, err)
	}
	if _, err := e.jwt.ValidateAccess(ch); err == nil {
		t.Fatal("challenge tidak boleh lolos sebagai access token")
	}
	if me := e.do(t, http.MethodGet, "/api/admin/auth/me", ch, nil); me.status != http.StatusUnauthorized {
		t.Fatalf("challenge sebagai Bearer: status = %d", me.status)
	}
	if e.store.lastLogins[u.ID] != 0 || e.audit.has("login") {
		t.Fatal("last_login dan audit login baru terjadi setelah TOTP")
	}
}

// ───────────────────────── /totp/verify ─────────────────────────

func (e *authEnv) challenge(t *testing.T, email string) string {
	t.Helper()
	r := e.login(t, email)
	ch, _ := r.data()["challenge"].(string)
	if ch == "" {
		t.Fatalf("login tidak memulangkan challenge: %v", r.body)
	}
	return ch
}

func (e *authEnv) verify(t *testing.T, challenge, code string) reply {
	t.Helper()
	return e.do(t, http.MethodPost, "/api/admin/auth/totp/verify", "", map[string]string{"challenge": challenge, "code": code})
}

func TestTOTPVerify_KodeBenar(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	ch := e.challenge(t, "mfa@coreasia.id")
	e.limiter.counts[u.ID.String()] = 2

	r := e.verify(t, ch, e.code(t, secret))
	if r.status != http.StatusOK {
		t.Fatalf("status = %d, body = %v", r.status, r.body)
	}
	sameKeys(t, "data", r.data(), "access_token", "refresh_token", "expires_at", "user")
	acc, err := e.jwt.ValidateAccess(r.data()["access_token"].(string))
	if err != nil || !acc.MFA {
		t.Fatalf("access token harus mfa=true: %+v %v", acc, err)
	}
	if ref, _ := e.jwt.ValidateRefresh(r.data()["refresh_token"].(string)); ref == nil || !ref.MFA {
		t.Fatal("refresh token harus mfa=true")
	}
	if r.cookie("auth_admin_token") == nil || r.cookie("refresh_admin_token") == nil {
		t.Fatal("cookie harus terpasang setelah TOTP")
	}
	cur := e.store.get(u.ID)
	if cur.TOTPLastStep == nil || *cur.TOTPLastStep != auth.TOTPStep(e.clock) {
		t.Fatalf("totp_last_step harus dicatat: %v", cur.TOTPLastStep)
	}
	if e.limiter.count(u.ID) != 0 {
		t.Fatal("hitungan gagal harus direset setelah berhasil")
	}
	if e.store.lastLogins[u.ID] != 1 || !e.audit.has("login") {
		t.Fatal("login ber-TOTP harus mencatat last_login dan audit")
	}

	me := e.do(t, http.MethodGet, "/api/admin/auth/me", r.data()["access_token"].(string), nil)
	if me.status != http.StatusOK || me.data()["mfa"] != true || me.data()["totp_enabled"] != true {
		t.Fatalf("/me setelah TOTP: %d %v", me.status, me.body)
	}
	at, _ := me.data()["totp_enabled_at"].(string)
	if ts, err := time.Parse(time.RFC3339, at); err != nil || !ts.Equal(cur.TOTPEnabledAt.Truncate(time.Nanosecond)) {
		t.Fatalf("/me totp_enabled_at = %v, want %v", me.data()["totp_enabled_at"], cur.TOTPEnabledAt)
	}
}

func TestTOTPVerify_KodeSalah(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	ch := e.challenge(t, "mfa@coreasia.id")

	r := e.verify(t, ch, e.wrongCode(t, secret))
	if r.status != http.StatusUnauthorized || r.errCode() != "TOTP_INVALID" {
		t.Fatalf("status = %d code = %s", r.status, r.errCode())
	}
	if len(r.cookies) != 0 || r.data() != nil {
		t.Fatal("kode salah tidak boleh menghasilkan token")
	}
	if e.limiter.count(u.ID) != 1 {
		t.Fatalf("hitungan gagal = %d, want 1", e.limiter.count(u.ID))
	}
	// Format salah → 400 dan tidak dihitung.
	if r := e.verify(t, ch, "12ab56"); r.status != http.StatusBadRequest {
		t.Fatalf("format salah: status = %d", r.status)
	}
	if e.limiter.count(u.ID) != 1 {
		t.Fatal("format salah tidak boleh menambah hitungan")
	}
}

func TestTOTPVerify_Replay(t *testing.T) {
	e := newAuthEnv(t)
	_, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	code := e.code(t, secret)

	if r := e.verify(t, e.challenge(t, "mfa@coreasia.id"), code); r.status != http.StatusOK {
		t.Fatalf("pemakaian pertama: status = %d", r.status)
	}
	// Kode yang sama, tantangan baru, masih di langkah waktu yang sama.
	r := e.verify(t, e.challenge(t, "mfa@coreasia.id"), code)
	if r.status != http.StatusUnauthorized || r.errCode() != "TOTP_INVALID" {
		t.Fatalf("replay: status = %d code = %s", r.status, r.errCode())
	}
	// Kode langkah berikutnya tetap diterima.
	e.clock = e.clock.Add(30 * time.Second)
	if r := e.verify(t, e.challenge(t, "mfa@coreasia.id"), e.code(t, secret)); r.status != http.StatusOK {
		t.Fatalf("langkah berikutnya: status = %d", r.status)
	}
}

func TestTOTPVerify_TantanganTidakSah(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	code := e.code(t, secret)

	expired, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, auth.Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    authTestIssuer,
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-6 * time.Minute)),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Minute)),
		},
		UserID: u.ID, Email: u.Email, Typ: auth.TokenTypeMFA,
	}).SignedString([]byte(authTestSecret))
	access := e.tokens(t, u, false)

	for name, ch := range map[string]string{
		"kedaluwarsa":   expired,
		"access token":  access.AccessToken,
		"refresh token": access.RefreshToken,
		"sampah":        "a.b.c",
	} {
		r := e.verify(t, ch, code)
		if r.status != http.StatusUnauthorized || r.errCode() != "MFA_CHALLENGE_INVALID" {
			t.Errorf("%s: status = %d code = %s", name, r.status, r.errCode())
		}
	}

	// token_version naik antara login dan verify (mis. sesi dicabut) → tantangan gugur.
	ch := e.challenge(t, "mfa@coreasia.id")
	_, _ = e.store.BumpTokenVersion(context.Background(), u.ID)
	if r := e.verify(t, ch, code); r.status != http.StatusUnauthorized || r.errCode() != "MFA_CHALLENGE_INVALID" {
		t.Fatalf("tv berubah: status = %d code = %s", r.status, r.errCode())
	}
	// Admin dinonaktifkan antara login dan verify.
	ch = e.challenge(t, "mfa@coreasia.id")
	e.store.users[u.ID].IsActive = false
	if r := e.verify(t, ch, code); r.status != http.StatusUnauthorized {
		t.Fatalf("nonaktif: status = %d", r.status)
	}
	if e.limiter.count(u.ID) != 0 {
		t.Fatal("tantangan tidak sah tidak dihitung sebagai kode salah")
	}
}

func TestTOTPVerify_429SetelahLimaGagal(t *testing.T) {
	e := newAuthEnv(t)
	_, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	ch := e.challenge(t, "mfa@coreasia.id")
	wrong := e.wrongCode(t, secret)

	for i := 1; i <= 5; i++ {
		if r := e.verify(t, ch, wrong); r.status != http.StatusUnauthorized {
			t.Fatalf("percobaan %d: status = %d, want 401", i, r.status)
		}
	}
	// Percobaan ke-6 ditolak walau kodenya benar.
	r := e.verify(t, ch, e.code(t, secret))
	if r.status != http.StatusTooManyRequests {
		t.Fatalf("percobaan ke-6: status = %d, want 429", r.status)
	}
	if r.header.Get("Retry-After") == "" {
		t.Fatal("429 harus membawa Retry-After")
	}
}

func TestTOTPVerify_RedisMatiGagalTertutup(t *testing.T) {
	e := newAuthEnv(t)
	_, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	ch := e.challenge(t, "mfa@coreasia.id")
	e.limiter.down = true
	if r := e.verify(t, ch, e.code(t, secret)); r.status != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", r.status)
	}
}

// Rahasia yang tidak bisa dibuka (JWT_SECRET dirotasi) tidak boleh menjadi
// jalan pintas melewati TOTP.
func TestTOTPVerify_RahasiaTakTerbukaTidakMelewatiTOTP(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	other, _ := auth.NewTOTPCipher("secret-lama-sebelum-rotasi")
	enc, _ := other.Seal(u.ID, secret)
	e.store.users[u.ID].TOTPSecretEnc = &enc

	r := e.verify(t, e.challenge(t, "mfa@coreasia.id"), e.code(t, secret))
	if r.status != http.StatusInternalServerError || len(r.cookies) != 0 {
		t.Fatalf("status = %d cookies = %v", r.status, r.cookies)
	}
}

// ───────────────────────── setup / enable / disable ─────────────────────────

// setupBody: /totp/setup wajib sandi saat ini.
var setupBody = map[string]string{"password": authTestPassword}

func TestTOTP_SetupEnableDisable(t *testing.T) {
	e := newAuthEnv(t)
	u := e.addAdmin(t, "baru@coreasia.id", "super_admin")
	tok := e.tokens(t, u, false)

	// setup: belum mengaktifkan apa pun.
	r := e.do(t, http.MethodPost, "/api/admin/auth/totp/setup", tok.AccessToken, setupBody)
	if r.status != http.StatusOK {
		t.Fatalf("setup: %d %v", r.status, r.body)
	}
	sameKeys(t, "setup", r.data(), "otpauth_url", "secret", "issuer", "account")
	secret := r.data()["secret"].(string)
	url := r.data()["otpauth_url"].(string)
	if !strings.HasPrefix(url, "otpauth://totp/CoreAsia%20Console:baru@coreasia.id?") || !strings.Contains(url, "secret="+secret) {
		t.Fatalf("otpauth_url salah: %s", url)
	}
	if r.header.Get("Cache-Control") != "no-store" {
		t.Fatal("jawaban setup berisi rahasia: wajib no-store")
	}
	cur := e.store.get(u.ID)
	if cur.TOTPPendingEnc == nil || cur.TOTPEnabled() || strings.Contains(*cur.TOTPPendingEnc, secret) {
		t.Fatal("setup harus menyimpan rahasia tertunda TERENKRIPSI tanpa mengaktifkan")
	}
	if me := e.do(t, http.MethodGet, "/api/admin/auth/me", tok.AccessToken, nil); me.data()["totp_enabled"] != false || me.data()["mfa"] != false {
		t.Fatalf("/me sebelum enable: %v", me.body)
	}

	// enable: kode salah → 400, sesi tetap sah.
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/enable", tok.AccessToken, map[string]string{"code": e.wrongCode(t, secret)}); r.status != http.StatusBadRequest || r.errCode() != "TOTP_INVALID" {
		t.Fatalf("enable kode salah: %d %s", r.status, r.errCode())
	}
	if e.store.totpOn(u.ID) {
		t.Fatal("kode salah tidak boleh mengaktifkan")
	}
	// enable: kode benar → aktif, token_version naik, sesi lama gugur.
	r = e.do(t, http.MethodPost, "/api/admin/auth/totp/enable", tok.AccessToken, map[string]string{"code": e.code(t, secret)})
	if r.status != http.StatusOK || r.data()["totp_enabled"] != true {
		t.Fatalf("enable: %d %v", r.status, r.body)
	}
	cur = e.store.get(u.ID)
	if !cur.TOTPEnabled() || cur.TokenVersion != 1 || cur.TOTPPendingEnc != nil {
		t.Fatalf("keadaan setelah enable salah: %+v", cur)
	}
	if !e.audit.has("totp_enable") {
		t.Fatal("enable harus diaudit")
	}
	if me := e.do(t, http.MethodGet, "/api/admin/auth/me", tok.AccessToken, nil); me.status != http.StatusUnauthorized {
		t.Fatalf("token sebelum enable harus gugur: %d", me.status)
	}

	// Setup ulang saat aktif → 409.
	e.clock = e.clock.Add(30 * time.Second)
	mfaTok := e.verify(t, e.challenge(t, "baru@coreasia.id"), e.code(t, secret))
	if mfaTok.status != http.StatusOK {
		t.Fatalf("login ulang dengan TOTP: %d %v", mfaTok.status, mfaTok.body)
	}
	access := mfaTok.data()["access_token"].(string)
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/setup", access, setupBody); r.status != http.StatusConflict {
		t.Fatalf("setup saat aktif: %d", r.status)
	}

	// disable: kode yang baru dipakai login (langkah sama) ditolak — anti-replay.
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/disable", access, map[string]string{"code": e.code(t, secret)}); r.status != http.StatusBadRequest {
		t.Fatalf("disable dengan kode terpakai: %d", r.status)
	}
	e.clock = e.clock.Add(30 * time.Second)
	r = e.do(t, http.MethodPost, "/api/admin/auth/totp/disable", access, map[string]string{"code": e.code(t, secret)})
	if r.status != http.StatusOK || r.data()["totp_enabled"] != false {
		t.Fatalf("disable: %d %v", r.status, r.body)
	}
	cur = e.store.get(u.ID)
	if cur.TOTPEnabled() || cur.TOTPSecretEnc != nil || cur.TOTPLastStep != nil || cur.TokenVersion != 2 {
		t.Fatalf("keadaan setelah disable salah: %+v", cur)
	}
	if me := e.do(t, http.MethodGet, "/api/admin/auth/me", access, nil); me.status != http.StatusUnauthorized {
		t.Fatalf("token sebelum disable harus gugur: %d", me.status)
	}
	// Login kembali tanpa TOTP.
	if r := e.login(t, "baru@coreasia.id"); r.data()["access_token"] == nil {
		t.Fatalf("setelah disable login kembali tanpa TOTP: %v", r.body)
	}
}

func TestTOTPEnable_TanpaSetup(t *testing.T) {
	e := newAuthEnv(t)
	u := e.addAdmin(t, "a@coreasia.id", "admin")
	r := e.do(t, http.MethodPost, "/api/admin/auth/totp/enable", e.tokens(t, u, false).AccessToken, map[string]string{"code": "123456"})
	if r.status != http.StatusBadRequest {
		t.Fatalf("status = %d", r.status)
	}
}

func TestTOTPDisable_ButuhSesiMFA(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	r := e.do(t, http.MethodPost, "/api/admin/auth/totp/disable", e.tokens(t, u, false).AccessToken, map[string]string{"code": e.code(t, secret)})
	if r.status != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", r.status)
	}
	if !e.store.totpOn(u.ID) {
		t.Fatal("TOTP tidak boleh mati")
	}
}

func TestTOTPDisable_BatasPercobaan(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	tok := e.tokens(t, u, true).AccessToken
	wrong := e.wrongCode(t, secret)
	for i := 0; i < 5; i++ {
		e.do(t, http.MethodPost, "/api/admin/auth/totp/disable", tok, map[string]string{"code": wrong})
	}
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/disable", tok, map[string]string{"code": e.code(t, secret)}); r.status != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", r.status)
	}
}

func TestTOTPSetup_SesiDicabutDitolak(t *testing.T) {
	e := newAuthEnv(t)
	u := e.addAdmin(t, "a@coreasia.id", "admin")
	tok := e.tokens(t, u, false)
	_, _ = e.store.BumpTokenVersion(context.Background(), u.ID)
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/setup", tok.AccessToken, setupBody); r.status != http.StatusUnauthorized {
		t.Fatalf("status = %d", r.status)
	}
}

// ───────────────────────── /me & /refresh ─────────────────────────

func TestMe_TokenVersionDanAktif(t *testing.T) {
	e := newAuthEnv(t)
	u := e.addAdmin(t, "a@coreasia.id", "admin")
	tok := e.tokens(t, u, false)

	r := e.do(t, http.MethodGet, "/api/admin/auth/me", tok.AccessToken, nil)
	if r.status != http.StatusOK {
		t.Fatalf("status = %d", r.status)
	}
	sameKeys(t, "/me", r.data(), "id", "email", "full_name", "role", "is_active", "last_login_at", "created_at", "mfa", "mfa_at", "totp_enabled", "totp_enabled_at")
	if r.data()["mfa"] != false || r.data()["mfa_at"] != nil || r.data()["totp_enabled"] != false || r.data()["totp_enabled_at"] != nil || r.data()["is_active"] != true {
		t.Fatalf("/me: %v", r.data())
	}

	_, _ = e.store.BumpTokenVersion(context.Background(), u.ID)
	if r := e.do(t, http.MethodGet, "/api/admin/auth/me", tok.AccessToken, nil); r.status != http.StatusUnauthorized {
		t.Fatalf("tv beda: status = %d", r.status)
	}
	tok = e.tokens(t, u, false)
	e.store.users[u.ID].IsActive = false
	if r := e.do(t, http.MethodGet, "/api/admin/auth/me", tok.AccessToken, nil); r.status != http.StatusUnauthorized {
		t.Fatalf("nonaktif: status = %d", r.status)
	}
	if r := e.do(t, http.MethodGet, "/api/admin/auth/me", tok.RefreshToken, nil); r.status != http.StatusUnauthorized {
		t.Fatalf("refresh sebagai Bearer: status = %d", r.status)
	}
}

func (e *authEnv) refresh(t *testing.T, token string) reply {
	t.Helper()
	return e.do(t, http.MethodPost, "/api/admin/auth/refresh", "", map[string]string{"refresh_token": token})
}

func TestRefresh(t *testing.T) {
	e := newAuthEnv(t)
	u := e.addAdmin(t, "a@coreasia.id", "admin")

	// access token → 401.
	if r := e.refresh(t, e.tokens(t, u, false).AccessToken); r.status != http.StatusUnauthorized {
		t.Fatalf("access ke /refresh: status = %d", r.status)
	}
	// Tantangan MFA → 401.
	ch, _, _ := e.jwt.GenerateMFAChallenge(u.ID, u.Email, 0)
	if r := e.refresh(t, ch); r.status != http.StatusUnauthorized {
		t.Fatalf("challenge ke /refresh: status = %d", r.status)
	}

	// Sah, mfa=false tetap false.
	r := e.refresh(t, e.tokens(t, u, false).RefreshToken)
	if r.status != http.StatusOK {
		t.Fatalf("refresh sah: %d %v", r.status, r.body)
	}
	sameKeys(t, "refresh", r.data(), "access_token", "refresh_token", "expires_at", "user")
	if acc, _ := e.jwt.ValidateAccess(r.data()["access_token"].(string)); acc == nil || acc.MFA {
		t.Fatal("refresh tidak boleh menaikkan mfa")
	}

	// mfa=true diwarisi ke access DAN refresh baru.
	r = e.refresh(t, e.tokens(t, u, true).RefreshToken)
	acc, _ := e.jwt.ValidateAccess(r.data()["access_token"].(string))
	ref, _ := e.jwt.ValidateRefresh(r.data()["refresh_token"].(string))
	if acc == nil || !acc.MFA || ref == nil || !ref.MFA {
		t.Fatal("mfa harus diwarisi dari refresh token")
	}

	// Lewat cookie juga.
	req := httptest.NewRequest(http.MethodPost, "/api/admin/auth/refresh", nil)
	req.AddCookie(&http.Cookie{Name: "refresh_admin_token", Value: e.tokens(t, u, false).RefreshToken})
	if resp, _ := e.app.Test(req); resp.StatusCode != http.StatusOK {
		t.Fatalf("refresh lewat cookie: %d", resp.StatusCode)
	}

	// token_version beda → 401.
	old := e.tokens(t, u, false).RefreshToken
	_, _ = e.store.BumpTokenVersion(context.Background(), u.ID)
	if r := e.refresh(t, old); r.status != http.StatusUnauthorized {
		t.Fatalf("tv beda: status = %d", r.status)
	}
	// Nonaktif → 401.
	cur := e.tokens(t, u, false).RefreshToken
	e.store.users[u.ID].IsActive = false
	if r := e.refresh(t, cur); r.status != http.StatusUnauthorized {
		t.Fatalf("nonaktif: status = %d", r.status)
	}
}

// ───────────────────────── pencabutan sesi ─────────────────────────

func TestLogoutAll(t *testing.T) {
	e := newAuthEnv(t)
	u := e.addAdmin(t, "a@coreasia.id", "admin")
	tok := e.tokens(t, u, false)

	r := e.do(t, http.MethodPost, "/api/admin/auth/logout-all", tok.AccessToken, nil)
	if r.status != http.StatusNoContent {
		t.Fatalf("status = %d", r.status)
	}
	if e.store.get(u.ID).TokenVersion != 1 || !e.audit.has("logout_all") {
		t.Fatal("logout-all harus menaikkan token_version dan diaudit")
	}
	if c := r.cookie("auth_admin_token"); c == nil || c.Value != "" {
		t.Fatal("cookie harus dikosongkan")
	}
	if me := e.do(t, http.MethodGet, "/api/admin/auth/me", tok.AccessToken, nil); me.status != http.StatusUnauthorized {
		t.Fatalf("/me token lama: %d", me.status)
	}
	if rf := e.refresh(t, tok.RefreshToken); rf.status != http.StatusUnauthorized {
		t.Fatalf("/refresh token lama: %d", rf.status)
	}
	// Sekali pakai: token yang sudah dicabut tidak bisa memanggilnya lagi.
	if r := e.do(t, http.MethodPost, "/api/admin/auth/logout-all", tok.AccessToken, nil); r.status != http.StatusUnauthorized {
		t.Fatalf("logout-all dengan token dicabut: %d", r.status)
	}
}

func TestRevokeSessions_SuperAdmin(t *testing.T) {
	e := newAuthEnv(t)
	boss := e.addAdmin(t, "boss@coreasia.id", "super_admin")
	target := e.addAdmin(t, "staf@coreasia.id", "admin")
	targetTok := e.tokens(t, target, false)
	bossTok := e.tokens(t, boss, true)

	// Admin biasa tidak boleh.
	if r := e.do(t, http.MethodPost, "/api/admin/users/"+boss.ID.String()+"/revoke-sessions", targetTok.AccessToken, nil); r.status != http.StatusForbidden {
		t.Fatalf("admin biasa: status = %d", r.status)
	}

	r := e.do(t, http.MethodPost, "/api/admin/users/"+target.ID.String()+"/revoke-sessions", bossTok.AccessToken, nil)
	if r.status != http.StatusOK || r.data()["sessions_revoked"] != true {
		t.Fatalf("revoke: %d %v", r.status, r.body)
	}
	if e.store.get(target.ID).TokenVersion != 1 || !e.audit.has("revoke_sessions") {
		t.Fatal("revoke-sessions harus menaikkan token_version target dan diaudit")
	}
	if e.store.get(boss.ID).TokenVersion != 0 {
		t.Fatal("sesi super admin sendiri tidak ikut dicabut")
	}
	if me := e.do(t, http.MethodGet, "/api/admin/auth/me", targetTok.AccessToken, nil); me.status != http.StatusUnauthorized {
		t.Fatalf("/me target: %d", me.status)
	}
	if rf := e.refresh(t, targetTok.RefreshToken); rf.status != http.StatusUnauthorized {
		t.Fatalf("/refresh target: %d", rf.status)
	}

	if r := e.do(t, http.MethodPost, "/api/admin/users/"+uuid.NewString()+"/revoke-sessions", bossTok.AccessToken, nil); r.status != http.StatusNotFound {
		t.Fatalf("id tak dikenal: %d", r.status)
	}
	if r := e.do(t, http.MethodPost, "/api/admin/users/bukan-uuid/revoke-sessions", bossTok.AccessToken, nil); r.status != http.StatusBadRequest {
		t.Fatalf("id rusak: %d", r.status)
	}
}

func TestUpdateAdmin_NonaktifMencabutSesi(t *testing.T) {
	e := newAuthEnv(t)
	boss := e.addAdmin(t, "boss@coreasia.id", "super_admin")
	target := e.addAdmin(t, "staf@coreasia.id", "admin")
	bossTok := e.tokens(t, boss, true).AccessToken
	path := "/api/admin/users/" + target.ID.String()

	// Ubah nama saja: sesi tidak dicabut.
	if r := e.do(t, http.MethodPut, path, bossTok, map[string]any{"full_name": "Staf Baru"}); r.status != http.StatusOK {
		t.Fatalf("update nama: %d %v", r.status, r.body)
	}
	if e.store.get(target.ID).TokenVersion != 0 {
		t.Fatal("ubah nama tidak boleh mencabut sesi")
	}
	// Nonaktifkan: sesi dicabut.
	if r := e.do(t, http.MethodPut, path, bossTok, map[string]any{"is_active": false}); r.status != http.StatusOK {
		t.Fatalf("nonaktifkan: %d %v", r.status, r.body)
	}
	if got := e.store.get(target.ID); got.IsActive || got.TokenVersion != 1 {
		t.Fatalf("nonaktif harus mencabut sesi: %+v", got)
	}
	// Aktifkan kembali: token lama tetap mati (tv sudah naik).
	if r := e.do(t, http.MethodPut, path, bossTok, map[string]any{"is_active": true}); r.status != http.StatusOK {
		t.Fatalf("aktifkan: %d", r.status)
	}
	if e.store.get(target.ID).TokenVersion != 1 {
		t.Fatal("mengaktifkan tidak menaikkan tv")
	}
	// Ganti sandi: sesi dicabut.
	if r := e.do(t, http.MethodPut, path, bossTok, map[string]any{"password": "SandiBaru-456"}); r.status != http.StatusOK {
		t.Fatalf("ganti sandi: %d", r.status)
	}
	if e.store.get(target.ID).TokenVersion != 2 {
		t.Fatal("ganti sandi harus mencabut sesi")
	}
}
