package auth

import (
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	testSecret = "rahasia-uji-jwt-bukan-produksi"
	testIssuer = "coreasia-gateway"
)

func newTestProvider() *JWTProvider {
	return NewJWTProvider(testSecret, 60*time.Minute, 720*time.Hour, testIssuer)
}

// signRaw menandatangani klaim apa adanya dengan secret uji — untuk merakit
// token yang tidak bisa dibuat lewat API publik (tanpa typ, kedaluwarsa, dsb).
func signRaw(t *testing.T, method jwt.SigningMethod, secret string, c Claims) string {
	t.Helper()
	s, err := jwt.NewWithClaims(method, c).SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	return s
}

func rawClaims(userID uuid.UUID, typ string, exp time.Time) Claims {
	return Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    testIssuer,
			IssuedAt:  jwt.NewNumericDate(exp.Add(-time.Hour)),
			ExpiresAt: jwt.NewNumericDate(exp),
			ID:        uuid.NewString(),
		},
		UserID: userID,
		Email:  "uji@coreasia.id",
		Role:   "super_admin",
		Typ:    typ,
	}
}

func TestGenerateTokenPair_KlaimTypMFATV(t *testing.T) {
	p := newTestProvider()
	uid := uuid.New()
	pair, err := p.GenerateTokenPair(uid, "uji@coreasia.id", "super_admin", "Uji", true, 7)
	if err != nil {
		t.Fatal(err)
	}

	acc, err := p.ValidateAccess(pair.AccessToken)
	if err != nil {
		t.Fatalf("access ditolak: %v", err)
	}
	if acc.Typ != TokenTypeAccess || !acc.MFA || acc.TV != 7 || acc.UserID != uid || acc.FullName != "Uji" {
		t.Fatalf("klaim access salah: %+v", acc)
	}

	ref, err := p.ValidateRefresh(pair.RefreshToken)
	if err != nil {
		t.Fatalf("refresh ditolak: %v", err)
	}
	if ref.Typ != TokenTypeRefresh || !ref.MFA || ref.TV != 7 || ref.UserID != uid {
		t.Fatalf("klaim refresh salah: %+v", ref)
	}
	if !pair.ExpiresAt.After(time.Now().Add(59 * time.Minute)) {
		t.Fatalf("ExpiresAt harus mengikuti access TTL, dapat %v", pair.ExpiresAt)
	}
}

// Setiap jenis token hanya lolos validatornya sendiri.
func TestValidators_MenolakJenisLain(t *testing.T) {
	p := newTestProvider()
	uid := uuid.New()
	pair, err := p.GenerateTokenPair(uid, "uji@coreasia.id", "admin", "Uji", false, 0)
	if err != nil {
		t.Fatal(err)
	}
	challenge, _, err := p.GenerateMFAChallenge(uid, "uji@coreasia.id", 0)
	if err != nil {
		t.Fatal(err)
	}

	tokens := map[string]string{
		TokenTypeAccess:  pair.AccessToken,
		TokenTypeRefresh: pair.RefreshToken,
		TokenTypeMFA:     challenge,
	}
	validators := map[string]func(string) (*Claims, error){
		TokenTypeAccess:  p.ValidateAccess,
		TokenTypeRefresh: p.ValidateRefresh,
		TokenTypeMFA:     p.ValidateMFAChallenge,
	}
	for tokTyp, tok := range tokens {
		for valTyp, validate := range validators {
			_, err := validate(tok)
			if tokTyp == valTyp && err != nil {
				t.Errorf("token %s ditolak validatornya sendiri: %v", tokTyp, err)
			}
			if tokTyp != valTyp && !errors.Is(err, ErrWrongTokenType) {
				t.Errorf("token %s di validator %s: err = %v, want ErrWrongTokenType", tokTyp, valTyp, err)
			}
		}
	}
}

// Token yang diterbitkan sebelum Fase 0c tidak punya typ → login ulang.
func TestValidators_MenolakTokenTanpaTyp(t *testing.T) {
	p := newTestProvider()
	tok := signRaw(t, jwt.SigningMethodHS256, testSecret, rawClaims(uuid.New(), "", time.Now().Add(time.Hour)))
	for name, validate := range map[string]func(string) (*Claims, error){
		"access": p.ValidateAccess, "refresh": p.ValidateRefresh, "mfa": p.ValidateMFAChallenge,
	} {
		if _, err := validate(tok); !errors.Is(err, ErrWrongTokenType) {
			t.Errorf("%s: token tanpa typ harus ditolak, err = %v", name, err)
		}
	}
}

func TestValidators_MenolakTypAsing(t *testing.T) {
	p := newTestProvider()
	tok := signRaw(t, jwt.SigningMethodHS256, testSecret, rawClaims(uuid.New(), "ACCESS", time.Now().Add(time.Hour)))
	if _, err := p.ValidateAccess(tok); err == nil {
		t.Fatal("typ harus dibandingkan persis")
	}
}

func TestValidators_Kedaluwarsa(t *testing.T) {
	p := newTestProvider()
	uid := uuid.New()

	// Diterbitkan 2 jam lalu dengan access TTL 60 menit → access mati, refresh hidup.
	p.now = func() time.Time { return time.Now().Add(-2 * time.Hour) }
	pair, err := p.GenerateTokenPair(uid, "uji@coreasia.id", "admin", "Uji", false, 0)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := p.ValidateAccess(pair.AccessToken); err == nil || !errors.Is(err, jwt.ErrTokenExpired) {
		t.Fatalf("access kedaluwarsa harus ditolak dengan ErrTokenExpired, err = %v", err)
	}
	if _, err := p.ValidateRefresh(pair.RefreshToken); err != nil {
		t.Fatalf("refresh 30 hari masih berlaku: %v", err)
	}

	// Tantangan MFA berumur 5 menit.
	p.now = func() time.Time { return time.Now().Add(-6 * time.Minute) }
	old, _, _ := p.GenerateMFAChallenge(uid, "uji@coreasia.id", 0)
	if _, err := p.ValidateMFAChallenge(old); !errors.Is(err, jwt.ErrTokenExpired) {
		t.Fatalf("tantangan berumur 6 menit harus kedaluwarsa, err = %v", err)
	}
	issued := time.Now().Add(-4 * time.Minute)
	p.now = func() time.Time { return issued }
	fresh, exp, _ := p.GenerateMFAChallenge(uid, "uji@coreasia.id", 0)
	if _, err := p.ValidateMFAChallenge(fresh); err != nil {
		t.Fatalf("tantangan berumur 4 menit masih berlaku: %v", err)
	}
	if got := exp.Sub(issued); got != MFAChallengeTTL {
		t.Fatalf("umur tantangan = %v, want %v", got, MFAChallengeTTL)
	}
}

func TestValidators_TandaTanganDanAlgoritma(t *testing.T) {
	p := newTestProvider()
	uid := uuid.New()
	exp := time.Now().Add(time.Hour)

	if _, err := p.ValidateAccess(signRaw(t, jwt.SigningMethodHS256, "secret-lain", rawClaims(uid, TokenTypeAccess, exp))); err == nil {
		t.Error("secret lain harus ditolak")
	}
	if _, err := p.ValidateAccess(signRaw(t, jwt.SigningMethodHS512, testSecret, rawClaims(uid, TokenTypeAccess, exp))); err == nil {
		t.Error("hanya HS256 yang diterima")
	}
	none, _ := jwt.NewWithClaims(jwt.SigningMethodNone, rawClaims(uid, TokenTypeAccess, exp)).SignedString(jwt.UnsafeAllowNoneSignatureType)
	if _, err := p.ValidateAccess(none); err == nil {
		t.Error("alg=none harus ditolak")
	}
	wrongIss := rawClaims(uid, TokenTypeAccess, exp)
	wrongIss.Issuer = "penerbit-lain"
	if _, err := p.ValidateAccess(signRaw(t, jwt.SigningMethodHS256, testSecret, wrongIss)); err == nil {
		t.Error("issuer lain harus ditolak")
	}
	noExp := rawClaims(uid, TokenTypeAccess, exp)
	noExp.ExpiresAt = nil
	if _, err := p.ValidateAccess(signRaw(t, jwt.SigningMethodHS256, testSecret, noExp)); err == nil {
		t.Error("token tanpa exp harus ditolak")
	}
	nilUser := rawClaims(uuid.Nil, TokenTypeAccess, exp)
	if _, err := p.ValidateAccess(signRaw(t, jwt.SigningMethodHS256, testSecret, nilUser)); err == nil {
		t.Error("token tanpa user_id harus ditolak")
	}
	if _, err := p.ValidateAccess("bukan.token.jwt"); err == nil {
		t.Error("sampah harus ditolak")
	}
}

// Putaran 3: sesi ber-MFA tidak boleh hidup melewati mfa_at + MFAMaxAge, berapa
// kali pun di-refresh. Sesi tanpa MFA tidak berubah.
func TestGenerateTokenPairMFA_UmurMaksimal(t *testing.T) {
	p := newTestProvider()
	now := time.Unix(time.Now().Unix(), 0)
	p.now = func() time.Time { return now }
	uid := uuid.New()

	check := func(name string, mfaAt time.Time, wantAccess, wantRefresh time.Time) {
		t.Helper()
		pair, err := p.GenerateTokenPairMFA(uid, "uji@coreasia.id", "super_admin", "Uji", mfaAt, 1)
		if err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		acc, err1 := p.ValidateAccess(pair.AccessToken)
		ref, err2 := p.ValidateRefresh(pair.RefreshToken)
		if err1 != nil || err2 != nil {
			t.Fatalf("%s: %v %v", name, err1, err2)
		}
		if !acc.ExpiresAt.Equal(wantAccess) || !ref.ExpiresAt.Equal(wantRefresh) ||
			!pair.ExpiresAt.Equal(wantAccess) || !pair.RefreshExpiresAt.Equal(wantRefresh) {
			t.Fatalf("%s: access %v refresh %v, want %v %v", name, acc.ExpiresAt.Time, ref.ExpiresAt.Time, wantAccess, wantRefresh)
		}
		wantMFA := !mfaAt.IsZero()
		if acc.MFA != wantMFA || ref.MFA != wantMFA || (wantMFA && (acc.MFAAt != mfaAt.Unix() || ref.MFAAt != mfaAt.Unix())) {
			t.Fatalf("%s: mfa/mfa_at salah: %+v %+v", name, acc, ref)
		}
	}
	check("tanpa MFA", time.Time{}, now.Add(time.Hour), now.Add(720*time.Hour))
	check("MFA baru", now, now.Add(time.Hour), now.Add(MFAMaxAge))
	check("MFA 2 jam", now.Add(-2*time.Hour), now.Add(time.Hour), now.Add(10*time.Hour))
	check("MFA 11,5 jam", now.Add(-690*time.Minute), now.Add(30*time.Minute), now.Add(30*time.Minute))

	if _, err := p.GenerateTokenPairMFA(uid, "uji@coreasia.id", "super_admin", "Uji", now.Add(-MFAMaxAge), 1); err != ErrMFAExpired {
		t.Fatalf("tepat di batas: err = %v, want ErrMFAExpired", err)
	}
	// GenerateTokenPair(mfa=true) = MFA baru sekarang.
	pair, _ := p.GenerateTokenPair(uid, "uji@coreasia.id", "super_admin", "Uji", true, 1)
	if acc, _ := p.ValidateAccess(pair.AccessToken); acc == nil || acc.MFAAt != now.Unix() {
		t.Fatalf("GenerateTokenPair(mfa=true) harus mengisi mfa_at = sekarang: %+v", acc)
	}
}

func TestClaims_HasFreshMFA(t *testing.T) {
	now := time.Now()
	cases := []struct {
		name string
		c    Claims
		want bool
	}{
		{"tanpa MFA", Claims{}, false},
		{"mfa tanpa mfa_at (token lama)", Claims{MFA: true}, false},
		{"mfa_at tanpa mfa", Claims{MFAAt: now.Unix()}, false},
		{"segar", Claims{MFA: true, MFAAt: now.Add(-time.Hour).Unix()}, true},
		{"basi", Claims{MFA: true, MFAAt: now.Add(-MFAMaxAge - time.Second).Unix()}, false},
	}
	for _, tc := range cases {
		if got := tc.c.HasFreshMFA(now); got != tc.want {
			t.Errorf("%s: %v, want %v", tc.name, got, tc.want)
		}
	}
	var nilClaims *Claims
	if !nilClaims.MFATime().IsZero() {
		t.Error("klaim nil tidak ber-MFA")
	}
}
