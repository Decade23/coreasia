package handler

import (
	"context"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
)

// Uji pengerasan Fase 0c putaran 3: sesi lemah tidak bisa mencetak sesi kuat,
// umur sesi ber-MFA, dan batas percobaan faktor kedua jangka panjang.

// ───────────────────────── rakitan ─────────────────────────

// enrollAndVerify menjalankan alur yang tersedia bagi pemegang sandi: login →
// setup → enable → login → verify. Memulangkan access token mfa=true.
func (e *authEnv) enrollAndVerify(t *testing.T, email, pw string) string {
	t.Helper()
	lr := e.loginWith(t, email, pw)
	tok, _ := lr.data()["access_token"].(string)
	if tok == "" {
		t.Fatalf("login %s: %d %v", email, lr.status, lr.body)
	}
	sr := e.do(t, http.MethodPost, "/api/admin/auth/totp/setup", tok, map[string]string{"password": pw})
	secret, _ := sr.data()["secret"].(string)
	if secret == "" {
		t.Fatalf("setup: %d %v", sr.status, sr.body)
	}
	code, _ := totp.GenerateCode(secret, e.clock)
	if er := e.do(t, http.MethodPost, "/api/admin/auth/totp/enable", tok, map[string]string{"code": code}); er.status != http.StatusOK {
		t.Fatalf("enable: %d %v", er.status, er.body)
	}
	e.clock = e.clock.Add(30 * time.Second)
	lr = e.loginWith(t, email, pw)
	ch, _ := lr.data()["challenge"].(string)
	code, _ = totp.GenerateCode(secret, e.clock)
	vr := e.verify(t, ch, code)
	strong, _ := vr.data()["access_token"].(string)
	if strong == "" {
		t.Fatalf("verify: %d %v", vr.status, vr.body)
	}
	if me := e.do(t, http.MethodGet, "/api/admin/auth/me", strong, nil); me.data()["mfa"] != true {
		t.Fatalf("harus mfa=true: %v", me.body)
	}
	return strong
}

// signClaims menandatangani klaim apa adanya dengan secret uji (token rakitan
// untuk keadaan yang tidak bisa dihasilkan provider, mis. token lama tanpa mfa_at).
func signClaims(t *testing.T, c auth.Claims) string {
	t.Helper()
	c.Issuer = authTestIssuer
	if c.IssuedAt == nil {
		c.IssuedAt = jwt.NewNumericDate(time.Now())
	}
	s, err := jwt.NewWithClaims(jwt.SigningMethodHS256, c).SignedString([]byte(authTestSecret))
	if err != nil {
		t.Fatal(err)
	}
	return s
}

// ───────────────────────── temuan 1: jalur A dan B ─────────────────────────

// PoC putaran 3 jalur A: access token curian (mfa=false) milik super admin
// tanpa TOTP membuat super admin baru dengan sandi pilihan pelaku. Kini putus
// di langkah pertama, begitu pula varian "buat admin biasa lalu naikkan".
func TestPutaran3_JalurA_SuperAdminBaruDariTokenCurian(t *testing.T) {
	e := newAuthEnv(t)
	lemah := e.addAdmin(t, "lemah@coreasia.id", "super_admin")
	e.addTOTPAdmin(t, "master@coreasia.id")
	stolen := e.tokens(t, lemah, false).AccessToken

	r := e.do(t, http.MethodPost, "/api/admin/users", stolen, map[string]any{
		"email": "pelaku@contoh.invalid", "password": "SandiPelaku-777!", "full_name": "Ops", "role": "super_admin",
	})
	if r.status != http.StatusForbidden || r.errCode() != "MFA_REQUIRED" {
		t.Fatalf("buat super admin dari token curian: %d %v", r.status, r.body)
	}
	if u, _ := e.store.FindByEmail(context.Background(), "pelaku@contoh.invalid"); u != nil {
		t.Fatal("super admin pelaku tidak boleh terbuat")
	}
	if !e.audit.has("mfa_required_denied") {
		t.Fatal("penolakan harus diaudit")
	}

	// Varian: admin biasa (boleh, tanpa izin /users) lalu dinaikkan → ditolak.
	r = e.do(t, http.MethodPost, "/api/admin/users", stolen, map[string]any{
		"email": "pelaku2@contoh.invalid", "password": "SandiPelaku-777!", "full_name": "Ops", "role": "admin",
	})
	if r.status != http.StatusCreated {
		t.Fatalf("buat admin biasa: %d %v", r.status, r.body)
	}
	id, _ := r.data()["id"].(string)
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+id, stolen, map[string]any{"role": "super_admin"}); r.status != http.StatusForbidden {
		t.Fatalf("naikkan admin pelaku ke super admin: %d %v", r.status, r.body)
	}
	if u, _ := e.store.FindByEmail(context.Background(), "pelaku2@contoh.invalid"); u == nil || u.Role != "admin" {
		t.Fatalf("peran admin pelaku tidak boleh naik: %+v", u)
	}
}

// PoC putaran 3 jalur B: PUT /users/<diri> {password} tanpa sandi lama. Kini
// wajib current_password, yang dibatasi dan diaudit seperti sandi di /totp/setup.
func TestPutaran3_JalurB_GantiSandiSendiriWajibSandiLama(t *testing.T) {
	e := newAuthEnv(t)
	lemah := e.addAdmin(t, "lemah@coreasia.id", "super_admin")
	e.addTOTPAdmin(t, "master@coreasia.id")
	stolen := e.tokens(t, lemah, false).AccessToken
	path := "/api/admin/users/" + lemah.ID.String()
	hash := e.store.get(lemah.ID).PasswordHash

	r := e.do(t, http.MethodPut, path, stolen, map[string]any{"password": "SandiPelaku-888!"})
	if r.status != http.StatusBadRequest || r.errCode() != "CURRENT_PASSWORD_REQUIRED" {
		t.Fatalf("ganti sandi sendiri tanpa sandi lama: %d %v", r.status, r.body)
	}
	if e.limiter.count(lemah.ID) != 0 {
		t.Fatal("permintaan tanpa sandi lama tidak memakai jatah")
	}
	for i := 1; i <= totpMaxFailures; i++ {
		r := e.do(t, http.MethodPut, path, stolen, map[string]any{"password": "SandiPelaku-888!", "current_password": "Tebakan-" + string(rune('0'+i))})
		if r.status != http.StatusBadRequest || r.errCode() != "PASSWORD_INVALID" {
			t.Fatalf("sandi lama salah ke-%d: %d %v", i, r.status, r.body)
		}
	}
	if r := e.do(t, http.MethodPut, path, stolen, map[string]any{"password": "SandiPelaku-888!", "current_password": authTestPassword}); r.status != http.StatusTooManyRequests {
		t.Fatalf("setelah %d sandi lama salah: %d, want 429 (jatah bersama faktor kedua)", totpMaxFailures, r.status)
	}
	if got := e.store.get(lemah.ID); got.PasswordHash != hash || got.TokenVersion != 0 {
		t.Fatal("sandi dan sesi tidak boleh berubah")
	}
	if n := e.audit.count("totp_failed"); n != totpMaxFailures {
		t.Fatalf("sandi lama salah harus diaudit: %d baris, want %d", n, totpMaxFailures)
	}

	// Pemilik sungguhan (tahu sandinya) tetap bisa mengganti sandi sendiri.
	e.limiter.expireWindow(lemah.ID)
	r = e.do(t, http.MethodPut, path, stolen, map[string]any{"password": "SandiBaru-999!", "current_password": authTestPassword})
	if r.status != http.StatusOK {
		t.Fatalf("ganti sandi sendiri dengan sandi lama benar: %d %v", r.status, r.body)
	}
	if got := e.store.get(lemah.ID); got.PasswordHash == hash || got.TokenVersion != 1 {
		t.Fatalf("sandi harus berganti dan sesi dicabut: tv=%d", got.TokenVersion)
	}
	if r := e.loginWith(t, "lemah@coreasia.id", "SandiBaru-999!"); r.data()["access_token"] == nil {
		t.Fatalf("login dengan sandi baru: %v", r.body)
	}
	// Mengubah kolom lain milik sendiri tidak butuh sandi lama.
	fresh := e.tokens(t, lemah, false).AccessToken
	if r := e.do(t, http.MethodPut, path, fresh, map[string]any{"full_name": "Nama Baru"}); r.status != http.StatusOK {
		t.Fatalf("ubah nama sendiri: %d %v", r.status, r.body)
	}
}

// Generalisasi jalur B: sesi lemah menyetel sandi super admin LAIN (tanpa
// TOTP), lalu mendaftarkan TOTP atas namanya. Ditolak begitu TOTP berlaku;
// admin biasa tetap bisa dikelola, dan masa transisi tidak terhalang.
func TestPutaran3_SandiSuperAdminLainButuhSesiKuat(t *testing.T) {
	e := newAuthEnv(t)
	lemah := e.addAdmin(t, "lemah@coreasia.id", "super_admin")
	lain := e.addAdmin(t, "lain@coreasia.id", "super_admin")
	staf := e.addAdmin(t, "staf@coreasia.id", "admin")
	e.addTOTPAdmin(t, "master@coreasia.id")
	weak := e.tokens(t, lemah, false).AccessToken
	hash := e.store.get(lain.ID).PasswordHash

	r := e.do(t, http.MethodPut, "/api/admin/users/"+lain.ID.String(), weak, map[string]any{"password": "SandiPelaku-123!"})
	if r.status != http.StatusForbidden || r.errCode() != "MFA_REQUIRED" {
		t.Fatalf("sandi super admin lain dari sesi lemah: %d %v", r.status, r.body)
	}
	if e.store.get(lain.ID).PasswordHash != hash {
		t.Fatal("sandi super admin lain tidak boleh berubah")
	}
	// Kolom lain milik super admin tanpa TOTP (bukan kredensial): tetap boleh.
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+lain.ID.String(), weak, map[string]any{"full_name": "Lain"}); r.status != http.StatusOK {
		t.Fatalf("ubah nama super admin tanpa TOTP: %d %v", r.status, r.body)
	}
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+staf.ID.String(), weak, map[string]any{"password": "SandiBaru-456!"}); r.status != http.StatusOK {
		t.Fatalf("sandi admin biasa dari sesi lemah: %d %v", r.status, r.body)
	}

	// Sesi kuat boleh.
	master := e.store.get(e.mustFind(t, "master@coreasia.id"))
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+lain.ID.String(), e.tokens(t, &master, true).AccessToken, map[string]any{"password": "SandiBaru-456!"}); r.status != http.StatusOK {
		t.Fatalf("sandi super admin lain dari sesi kuat: %d %v", r.status, r.body)
	}

	// Transisi: belum ada admin ber-TOTP → boleh.
	e2 := newAuthEnv(t)
	a := e2.addAdmin(t, "a@coreasia.id", "super_admin")
	b := e2.addAdmin(t, "b@coreasia.id", "super_admin")
	if r := e2.do(t, http.MethodPut, "/api/admin/users/"+b.ID.String(), e2.tokens(t, a, false).AccessToken, map[string]any{"password": "SandiBaru-456!"}); r.status != http.StatusOK {
		t.Fatalf("sandi super admin lain di masa transisi: %d %v", r.status, r.body)
	}
}

func (e *authEnv) mustFind(t *testing.T, email string) uuid.UUID {
	t.Helper()
	u, _ := e.store.FindByEmail(context.Background(), email)
	if u == nil {
		t.Fatalf("admin %s tidak ada", email)
	}
	return u.ID
}

// Temuan inti: requireMFAForTarget hanya memeriksa klaim mfa. Pemegang sandi
// super admin tanpa TOTP (ancaman K4) bisa mendaftar TOTP sendiri dan langsung
// mendapat mfa=true. Kini pendaftaran yang lebih muda dari 24 jam tidak memberi
// kuasa atas admin lain, dan semua langkahnya tercatat di audit.
func TestPutaran3_PendaftaranBaruTidakBisaMelucutiMaster(t *testing.T) {
	e := newAuthEnv(t)
	lemah := e.addAdmin(t, "lemah@coreasia.id", "super_admin")
	master, _ := e.addTOTPAdmin(t, "master@coreasia.id")
	lain := e.addAdmin(t, "lain@coreasia.id", "super_admin")
	staf := e.addAdmin(t, "staf@coreasia.id", "admin")
	masterHash := e.store.get(master.ID).PasswordHash

	strong := e.enrollAndVerify(t, "lemah@coreasia.id", authTestPassword)
	base := "/api/admin/users/" + master.ID.String()
	for _, a := range []struct {
		name, method, path string
		body               any
	}{
		{"ganti sandi Master", http.MethodPut, base, map[string]any{"password": "SandiPelaku-123!"}},
		{"reset TOTP Master", http.MethodPost, base + "/totp/reset", nil},
		{"hapus Master", http.MethodDelete, base, nil},
		{"buat super admin", http.MethodPost, "/api/admin/users", map[string]any{"email": "x@contoh.invalid", "password": "SandiKuat-123!", "full_name": "Pintu", "role": "super_admin"}},
		{"naikkan staf", http.MethodPut, "/api/admin/users/" + staf.ID.String(), map[string]any{"role": "super_admin"}},
		{"sandi super admin lain", http.MethodPut, "/api/admin/users/" + lain.ID.String(), map[string]any{"password": "SandiPelaku-123!"}},
	} {
		r := e.do(t, a.method, a.path, strong, a.body)
		if r.status != http.StatusForbidden || r.errCode() != "MFA_ENROLLMENT_TOO_RECENT" {
			t.Errorf("%s dari pendaftaran TOTP baru: %d %s, want 403 MFA_ENROLLMENT_TOO_RECENT", a.name, r.status, r.errCode())
		}
	}
	if got := e.store.get(master.ID); !got.TOTPEnabled() || got.PasswordHash != masterHash || got.TokenVersion != 0 {
		t.Fatalf("Master tidak boleh tersentuh: %+v", got)
	}
	for _, act := range []string{"totp_setup", "totp_enable", "login_mfa_challenge", "login", "mfa_required_denied"} {
		if !e.audit.has(act) {
			t.Errorf("audit %s tidak tercatat", act)
		}
	}
	// Akun baru yang TOTP-nya lama (mis. diaktifkan lewat SQL) juga belum kuat.
	e.store.mu.Lock()
	old := time.Now().Add(-48 * time.Hour)
	e.store.users[lemah.ID].TOTPEnabledAt = &old
	e.store.mu.Unlock()
	if r := e.do(t, http.MethodPost, base+"/totp/reset", strong, nil); r.errCode() != "MFA_ENROLLMENT_TOO_RECENT" {
		t.Fatalf("akun pelaku < 24 jam: %d %s", r.status, r.errCode())
	}

	// Masa tenggang adalah batas waktu, bukan larangan permanen: setelah 24 jam
	// sesi mfa=true yang segar kembali kuat (jendela deteksi = audit di atas).
	e.store.mu.Lock()
	e.store.users[lemah.ID].CreatedAt = time.Now().Add(-72 * time.Hour)
	e.store.mu.Unlock()
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+staf.ID.String(), strong, map[string]any{"full_name": "Staf"}); r.status != http.StatusOK {
		t.Fatalf("setelah masa tenggang: %d %v", r.status, r.body)
	}
}

// Akun sendiri yang ber-TOTP: cukup sesi ber-MFA segar, tanpa masa tenggang
// (mengubah diri sendiri tidak memberi kuasa baru). Sesi mfa=false ditolak.
func TestPutaran3_AkunSendiriBerTOTP(t *testing.T) {
	e := newAuthEnv(t)
	u, _ := e.addTOTPAdminSince(t, "baru@coreasia.id", time.Minute)
	path := "/api/admin/users/" + u.ID.String()
	if r := e.do(t, http.MethodPut, path, e.tokens(t, u, false).AccessToken, map[string]any{"full_name": "X"}); r.status != http.StatusForbidden || r.errCode() != "MFA_REQUIRED" {
		t.Fatalf("diri ber-TOTP dari sesi mfa=false: %d %s", r.status, r.errCode())
	}
	tok := e.tokens(t, u, true).AccessToken
	if r := e.do(t, http.MethodPut, path, tok, map[string]any{"full_name": "Nama Baru"}); r.status != http.StatusOK {
		t.Fatalf("ubah nama sendiri dari sesi ber-MFA: %d %v", r.status, r.body)
	}
	if r := e.do(t, http.MethodPut, path, tok, map[string]any{"password": "SandiBaru-999!", "current_password": authTestPassword}); r.status != http.StatusOK {
		t.Fatalf("ganti sandi sendiri (MFA + sandi lama): %d %v", r.status, r.body)
	}
}

// ───────────────────────── temuan 3: umur sesi ber-MFA ─────────────────────────

func TestPutaran3_SesiMFABerumurMaksimal(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	now := time.Now()

	// Token hasil verify: refresh token TIDAK lagi berumur 30 hari.
	vr := e.verify(t, e.challenge(t, "mfa@coreasia.id"), e.code(t, secret))
	ref, err := e.jwt.ValidateRefresh(vr.data()["refresh_token"].(string))
	if err != nil || !ref.MFA || ref.MFAAt == 0 {
		t.Fatalf("refresh token hasil verify: %+v %v", ref, err)
	}
	if lim := time.Unix(ref.MFAAt, 0).Add(auth.MFAMaxAge); ref.ExpiresAt.After(lim) {
		t.Fatalf("refresh token ber-MFA berlaku sampai %v, melewati mfa_at+%v = %v", ref.ExpiresAt.Time, auth.MFAMaxAge, lim)
	}
	if c := vr.cookie("refresh_admin_token"); c == nil || c.Expires.After(now.Add(auth.MFAMaxAge+time.Minute)) {
		t.Fatalf("cookie refresh harus ikut dipotong: %+v", c)
	}

	// mfa_at 11 jam lalu: refresh masih boleh, token baru dipotong di mfa_at+12j
	// dan mfa_at terbawa apa adanya.
	mfaAt := now.Add(-11 * time.Hour).Truncate(time.Second)
	cur := e.store.get(u.ID)
	pair, err := e.jwt.GenerateTokenPairMFA(u.ID, u.Email, u.Role, u.FullName, mfaAt, cur.TokenVersion)
	if err != nil {
		t.Fatal(err)
	}
	r := e.refresh(t, pair.RefreshToken)
	if r.status != http.StatusOK {
		t.Fatalf("refresh 11 jam: %d %v", r.status, r.body)
	}
	sameKeys(t, "refresh", r.data(), "access_token", "refresh_token", "expires_at", "user")
	limit := mfaAt.Add(auth.MFAMaxAge)
	acc, _ := e.jwt.ValidateAccess(r.data()["access_token"].(string))
	ref, _ = e.jwt.ValidateRefresh(r.data()["refresh_token"].(string))
	if acc == nil || ref == nil || !acc.MFA || acc.MFAAt != mfaAt.Unix() || ref.MFAAt != mfaAt.Unix() {
		t.Fatalf("mfa/mfa_at harus terbawa: %+v %+v", acc, ref)
	}
	if acc.ExpiresAt.After(limit) || ref.ExpiresAt.After(limit) {
		t.Fatalf("token baru melewati mfa_at+12j: access %v refresh %v batas %v", acc.ExpiresAt.Time, ref.ExpiresAt.Time, limit)
	}
	me := e.do(t, http.MethodGet, "/api/admin/auth/me", r.data()["access_token"].(string), nil)
	if at, _ := me.data()["mfa_at"].(string); me.data()["mfa"] != true || at == "" {
		t.Fatalf("/me mfa & mfa_at: %v", me.body)
	} else if ts, _ := time.Parse(time.RFC3339, at); !ts.Equal(mfaAt) {
		t.Fatalf("/me mfa_at = %v, want %v", at, mfaAt)
	}

	// Batas sudah lewat: provider menolak menerbitkan.
	if _, err := e.jwt.GenerateTokenPairMFA(u.ID, u.Email, u.Role, u.FullName, now.Add(-13*time.Hour), cur.TokenVersion); err != auth.ErrMFAExpired {
		t.Fatalf("mfa_at 13 jam: err = %v, want ErrMFAExpired", err)
	}
	// Refresh token ber-MFA yang (entah bagaimana) masih sah setelah mfa_at+12j,
	// dan refresh token ber-MFA tanpa mfa_at (terbit sebelum klaim ini): ditolak.
	base := auth.Claims{
		RegisteredClaims: jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour))},
		UserID:           u.ID, Email: u.Email, Role: u.Role, Typ: auth.TokenTypeRefresh, MFA: true, TV: cur.TokenVersion,
	}
	stale := base
	stale.MFAAt = now.Add(-13 * time.Hour).Unix()
	for name, tok := range map[string]string{"basi": signClaims(t, stale), "tanpa mfa_at": signClaims(t, base)} {
		if r := e.refresh(t, tok); r.status != http.StatusUnauthorized || r.errCode() != "MFA_SESSION_EXPIRED" {
			t.Errorf("refresh %s: %d %s, want 401 MFA_SESSION_EXPIRED", name, r.status, r.errCode())
		}
	}

	// Access token ber-mfa tanpa mfa_at: tidak dihitung ber-MFA di mana pun.
	legacy := base
	legacy.Typ, legacy.FullName = auth.TokenTypeAccess, u.FullName
	legacyTok := signClaims(t, legacy)
	if me := e.do(t, http.MethodGet, "/api/admin/auth/me", legacyTok, nil); me.status != http.StatusOK || me.data()["mfa"] != false || me.data()["mfa_at"] != nil {
		t.Fatalf("/me token lama: %d %v", me.status, me.body)
	}
	e.clock = e.clock.Add(time.Minute)
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/disable", legacyTok, map[string]string{"code": e.code(t, secret)}); r.status != http.StatusForbidden {
		t.Fatalf("disable dari token lama: %d", r.status)
	}
	other, _ := e.addTOTPAdmin(t, "lain@coreasia.id")
	if r := e.do(t, http.MethodPost, "/api/admin/users/"+other.ID.String()+"/totp/reset", legacyTok, nil); r.status != http.StatusForbidden || r.errCode() != "MFA_REQUIRED" {
		t.Fatalf("reset TOTP dari token lama: %d %s", r.status, r.errCode())
	}

	// Sesi tanpa MFA tidak terpengaruh: refresh token 30 hari seperti biasa.
	plain := e.addAdmin(t, "biasa@coreasia.id", "admin")
	r = e.refresh(t, e.tokens(t, plain, false).RefreshToken)
	ref, _ = e.jwt.ValidateRefresh(r.data()["refresh_token"].(string))
	if r.status != http.StatusOK || ref == nil || ref.MFA || ref.MFAAt != 0 || ref.ExpiresAt.Before(now.Add(719*time.Hour)) {
		t.Fatalf("refresh tanpa MFA: %d %+v", r.status, ref)
	}
}

// ───────────────────────── temuan 2 & 4: batas jangka panjang + audit ─────────────────────────

// Pemegang sandi yang sabar: 5 tebakan per 15 menit tidak lagi berarti 480 per
// hari selamanya. Setelah totpMaxFailuresLong kegagalan, verifikasi terkunci
// (kode BENAR pun tidak dievaluasi) sampai super admin membukanya.
func TestPutaran3_BatasJangkaPanjangMengunci(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	wrong := e.wrongCode(t, secret)

	failures := 0
	for failures < totpMaxFailuresLong {
		ch := e.challenge(t, "mfa@coreasia.id")
		for i := 0; i < totpMaxFailures && failures < totpMaxFailuresLong; i++ {
			if r := e.verify(t, ch, wrong); r.status != http.StatusUnauthorized {
				t.Fatalf("kegagalan ke-%d: %d %v", failures+1, r.status, r.body)
			}
			failures++
		}
		e.limiter.expireWindow(u.ID) // jendela 15 menit berlalu
	}
	if n := e.audit.count("totp_failed"); n != totpMaxFailuresLong {
		t.Fatalf("audit totp_failed = %d, want %d (satu per kode salah yang dievaluasi)", n, totpMaxFailuresLong)
	}
	if d := e.audit.descsOf("totp_failed"); !strings.Contains(d[0], "sandi akun ini BENAR") {
		t.Fatalf("deskripsi audit harus menyebut sandi sudah benar: %q", d[0])
	}
	if e.audit.count("totp_locked") != 1 {
		t.Fatal("penguncian harus diaudit sekali")
	}

	evals := e.evals.Load()
	r := e.verify(t, e.challenge(t, "mfa@coreasia.id"), e.code(t, secret))
	if r.status != http.StatusLocked || r.errCode() != "TOTP_LOCKED" || r.header.Get("Retry-After") == "" || len(r.cookies) != 0 {
		t.Fatalf("kode benar saat terkunci: %d %s (Retry-After %q)", r.status, r.errCode(), r.header.Get("Retry-After"))
	}
	if e.evals.Load() != evals {
		t.Fatal("kode tidak boleh dievaluasi saat terkunci")
	}
	// Jatah bersama: disable dari sesi ber-MFA juga terkunci.
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/disable", e.tokens(t, u, true).AccessToken, map[string]string{"code": e.code(t, secret)}); r.status != http.StatusLocked {
		t.Fatalf("disable saat terkunci: %d", r.status)
	}
	if e.audit.count("totp_failed") != totpMaxFailuresLong {
		t.Fatal("percobaan yang tidak dievaluasi tidak menambah baris audit")
	}

	// Dibuka super admin (sesi kuat) dengan mengganti sandi: akun tetap
	// ber-TOTP, pemilik login dengan sandi baru + kode.
	boss, _ := e.addTOTPAdmin(t, "boss@coreasia.id")
	if r := e.do(t, http.MethodPut, "/api/admin/users/"+u.ID.String(), e.tokens(t, boss, true).AccessToken, map[string]any{"password": "SandiBaru-456!"}); r.status != http.StatusOK {
		t.Fatalf("ganti sandi oleh super admin: %d %v", r.status, r.body)
	}
	if e.limiter.longCount(u.ID) != 0 || e.limiter.count(u.ID) != 0 {
		t.Fatal("ganti sandi harus membuka kunci")
	}
	e.clock = e.clock.Add(30 * time.Second)
	lr := e.loginWith(t, "mfa@coreasia.id", "SandiBaru-456!")
	if r := e.verify(t, lr.data()["challenge"].(string), e.code(t, secret)); r.status != http.StatusOK {
		t.Fatalf("login setelah dibuka: %d %v", r.status, r.body)
	}
}

// Reset TOTP oleh super admin juga membuka kunci (pemilik bisa mendaftar ulang).
func TestPutaran3_ResetTOTPMembukaKunci(t *testing.T) {
	e := newAuthEnv(t)
	u, _ := e.addTOTPAdmin(t, "mfa@coreasia.id")
	e.limiter.long[u.ID.String()] = totpMaxFailuresLong
	boss, _ := e.addTOTPAdmin(t, "boss@coreasia.id")
	if r := e.do(t, http.MethodPost, "/api/admin/users/"+u.ID.String()+"/totp/reset", e.tokens(t, boss, true).AccessToken, nil); r.status != http.StatusOK {
		t.Fatalf("reset: %d %v", r.status, r.body)
	}
	if e.limiter.longCount(u.ID) != 0 {
		t.Fatal("reset TOTP harus membuka kunci")
	}
	tok := e.loginWith(t, "mfa@coreasia.id", authTestPassword).data()["access_token"].(string)
	if r := e.do(t, http.MethodPost, "/api/admin/auth/totp/setup", tok, setupBody); r.status != http.StatusOK {
		t.Fatalf("daftar ulang setelah reset: %d %v", r.status, r.body)
	}
}

// Keberhasilan hanya mengembalikan jatahnya sendiri: pemilik yang login setiap
// hari tidak menghapus jejak tebakan pelaku dari jendela panjang.
func TestPutaran3_KeberhasilanTidakMenghapusKegagalanLama(t *testing.T) {
	e := newAuthEnv(t)
	u, secret := e.addTOTPAdmin(t, "mfa@coreasia.id")
	ch := e.challenge(t, "mfa@coreasia.id")
	for i := 0; i < 3; i++ {
		e.verify(t, ch, e.wrongCode(t, secret))
	}
	if r := e.verify(t, ch, e.code(t, secret)); r.status != http.StatusOK {
		t.Fatalf("kode benar: %d", r.status)
	}
	if e.limiter.count(u.ID) != 0 {
		t.Fatal("jendela pendek kosong setelah berhasil")
	}
	if n := e.limiter.longCount(u.ID); n != 3 {
		t.Fatalf("jendela panjang = %d, want 3 (kegagalan lama tetap terhitung)", n)
	}
}

// Penerbitan tantangan (sandi benar) diaudit; login admin tanpa TOTP tidak.
func TestPutaran3_AuditTantangan(t *testing.T) {
	e := newAuthEnv(t)
	e.addTOTPAdmin(t, "mfa@coreasia.id")
	e.addAdmin(t, "biasa@coreasia.id", "admin")
	e.challenge(t, "mfa@coreasia.id")
	if e.audit.count("login_mfa_challenge") != 1 || e.audit.has("login") {
		t.Fatalf("tantangan harus diaudit tanpa audit login: %v", e.audit.actions)
	}
	e.login(t, "biasa@coreasia.id")
	if e.audit.count("login_mfa_challenge") != 1 || !e.audit.has("login") {
		t.Fatalf("login tanpa TOTP: %v", e.audit.actions)
	}
}
