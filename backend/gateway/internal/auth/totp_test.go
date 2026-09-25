package auth

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/testenv"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
	"github.com/redis/go-redis/v9"
)

func TestTOTPCipher_BolakBalik(t *testing.T) {
	c, err := NewTOTPCipher(testSecret)
	if err != nil {
		t.Fatal(err)
	}
	uid := uuid.New()
	enc1, err := c.Seal(uid, "JBSWY3DPEHPK3PXP")
	if err != nil {
		t.Fatal(err)
	}
	enc2, _ := c.Seal(uid, "JBSWY3DPEHPK3PXP")
	if enc1 == enc2 {
		t.Fatal("nonce acak: dua enkripsi rahasia yang sama harus berbeda")
	}
	if !strings.HasPrefix(enc1, "v1:") || strings.Contains(enc1, "JBSWY3DPEHPK3PXP") {
		t.Fatalf("format ciphertext tak terduga: %q", enc1)
	}
	got, err := c.Open(uid, enc1)
	if err != nil || got != "JBSWY3DPEHPK3PXP" {
		t.Fatalf("Open = %q, %v", got, err)
	}
}

func TestTOTPCipher_KunciSalahGagal(t *testing.T) {
	uid := uuid.New()
	c1, _ := NewTOTPCipher(testSecret)
	c2, _ := NewTOTPCipher(testSecret + "-dirotasi")
	enc, _ := c1.Seal(uid, "JBSWY3DPEHPK3PXP")

	if _, err := c2.Open(uid, enc); !errors.Is(err, ErrTOTPDecrypt) {
		t.Fatalf("kunci lain (JWT_SECRET dirotasi) harus gagal, err = %v", err)
	}
	if _, err := c1.Open(uuid.New(), enc); !errors.Is(err, ErrTOTPDecrypt) {
		t.Fatalf("ciphertext milik admin lain harus gagal (AAD), err = %v", err)
	}
	rusak := enc[:len(enc)-2] + "AA"
	if rusak == enc {
		rusak = enc[:len(enc)-2] + "BB"
	}
	if _, err := c1.Open(uid, rusak); !errors.Is(err, ErrTOTPDecrypt) {
		t.Fatalf("ciphertext rusak harus gagal, err = %v", err)
	}
	for _, bad := range []string{"", "v1:", "v2:" + strings.TrimPrefix(enc, "v1:"), strings.TrimPrefix(enc, "v1:"), "v1:!!!"} {
		if _, err := c1.Open(uid, bad); !errors.Is(err, ErrTOTPDecrypt) {
			t.Errorf("Open(%q) harus ErrTOTPDecrypt, err = %v", bad, err)
		}
	}
	if _, err := NewTOTPCipher(""); err == nil {
		t.Fatal("JWT secret kosong harus ditolak")
	}
}

func TestNewTOTPKey_URIOtpauth(t *testing.T) {
	secret, uri, err := NewTOTPKey("admin@coreasia.id")
	if err != nil {
		t.Fatal(err)
	}
	if len(secret) != 32 { // 20 byte → 32 aksara base32 tanpa padding
		t.Fatalf("panjang rahasia = %d, want 32", len(secret))
	}
	u, err := url.Parse(uri)
	if err != nil {
		t.Fatal(err)
	}
	q := u.Query()
	if u.Scheme != "otpauth" || u.Host != "totp" || u.Path != "/CoreAsia Console:admin@coreasia.id" {
		t.Fatalf("URI salah: %s", uri)
	}
	if q.Get("secret") != secret || q.Get("issuer") != "CoreAsia Console" || q.Get("period") != "30" ||
		q.Get("digits") != "6" || q.Get("algorithm") != "SHA1" {
		t.Fatalf("parameter URI salah: %v", q)
	}
}

// Vektor uji RFC 6238 lampiran B (SHA1), dipotong ke 6 digit.
func TestVerifyTOTP_VektorRFC6238(t *testing.T) {
	const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ" // base32("12345678901234567890")
	cases := []struct {
		unix int64
		code string
	}{
		{59, "287082"},
		{1111111109, "081804"},
		{1234567890, "005924"},
		{2000000000, "279037"},
	}
	for _, tc := range cases {
		step, ok, err := VerifyTOTP(secret, tc.code, time.Unix(tc.unix, 0), nil)
		if err != nil || !ok || step != tc.unix/30 {
			t.Errorf("T=%d kode %s: step=%d ok=%v err=%v", tc.unix, tc.code, step, ok, err)
		}
	}
}

func TestVerifyTOTP_JendelaDanReplay(t *testing.T) {
	secret, _, _ := NewTOTPKey("uji@coreasia.id")
	now := time.Unix(1_800_000_015, 0) // di tengah langkah
	cur := TOTPStep(now)
	code := func(t0 time.Time) string {
		c, err := totp.GenerateCode(secret, t0)
		if err != nil {
			t.Fatal(err)
		}
		return c
	}

	for _, d := range []time.Duration{-30 * time.Second, 0, 30 * time.Second} {
		step, ok, err := VerifyTOTP(secret, code(now.Add(d)), now, nil)
		if err != nil || !ok || step != TOTPStep(now.Add(d)) {
			t.Errorf("geser %v harus diterima: step=%d ok=%v err=%v", d, step, ok, err)
		}
	}
	for _, d := range []time.Duration{-90 * time.Second, 90 * time.Second} {
		if _, ok, _ := VerifyTOTP(secret, code(now.Add(d)), now, nil); ok {
			t.Errorf("geser %v di luar jendela ±1 harus ditolak", d)
		}
	}

	// Anti-replay: langkah yang sudah diterima tidak bisa dipakai lagi.
	last := cur
	if _, ok, _ := VerifyTOTP(secret, code(now), now, &last); ok {
		t.Error("kode langkah yang sama dengan totp_last_step harus ditolak")
	}
	if _, ok, _ := VerifyTOTP(secret, code(now.Add(-30*time.Second)), now, &last); ok {
		t.Error("kode langkah sebelum totp_last_step harus ditolak")
	}
	if step, ok, _ := VerifyTOTP(secret, code(now.Add(30*time.Second)), now, &last); !ok || step != cur+1 {
		t.Error("kode langkah sesudah totp_last_step harus diterima")
	}

	// Format.
	c := code(now)
	if _, ok, _ := VerifyTOTP(secret, c[:3]+" "+c[3:], now, nil); !ok {
		t.Error("spasi di tengah kode (tampilan aplikasi) harus diterima")
	}
	for _, bad := range []string{"", "12345", "1234567", "12a456", "１２３４５６"} {
		if _, ok, _ := VerifyTOTP(secret, bad, now, nil); ok {
			t.Errorf("kode %q harus ditolak", bad)
		}
	}
	valid := map[string]bool{code(now.Add(-30 * time.Second)): true, c: true, code(now.Add(30 * time.Second)): true}
	wrong := "000000"
	for i := 1; valid[wrong]; i++ {
		wrong = strings.Repeat(string(rune('0'+i)), 6)
	}
	if _, ok, _ := VerifyTOTP(secret, wrong, now, nil); ok {
		t.Error("kode salah harus ditolak")
	}
	if _, _, err := VerifyTOTP("bukan base32 !!", c, now, nil); err == nil {
		t.Error("rahasia rusak harus menghasilkan error")
	}
}

// Uji RedisAttemptLimiter terhadap Redis sungguhan. Opt-in lewat
// GATEWAY_TEST_REDIS_ADDR (mis. localhost:6380) supaya `go test` tidak pernah
// menulis ke Redis yang kebetulan terpasang di port itu; memakai DB 15 dan
// kunci acak yang dihapus sesudahnya.
func TestRedisAttemptLimiter(t *testing.T) {
	addr := testenv.RedisAddr(t)
	rdb := redis.NewClient(&redis.Options{Addr: addr, DB: 15})
	defer rdb.Close()
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		testenv.Unavailable(t, "redis %s tidak terjangkau: %v", addr, err)
	}

	l := NewRedisAttemptLimiter(rdb, 3, 2*time.Second)
	l.prefix = "gateway:uji:" + uuid.NewString() + ":"
	uid := uuid.New()
	defer rdb.Del(ctx, l.key(uid))

	for i := int64(1); i <= 3; i++ {
		allowed, n, retry, err := l.Take(ctx, uid)
		if err != nil || !allowed || n != i || retry <= 0 || retry > 2*time.Second {
			t.Fatalf("Take ke-%d: allowed=%v n=%d retry=%v err=%v", i, allowed, n, retry, err)
		}
	}
	allowed, n, retry, err := l.Take(ctx, uid)
	if err != nil || allowed || n != 4 || retry <= 0 || retry > 2*time.Second {
		t.Fatalf("Take ke-4: allowed=%v n=%d retry=%v err=%v", allowed, n, retry, err)
	}
	if ttl := rdb.PTTL(ctx, l.key(uid)).Val(); ttl <= 0 {
		t.Fatalf("kunci harus punya TTL, dapat %v", ttl)
	}
	if err := l.Reset(ctx, uid); err != nil {
		t.Fatal(err)
	}
	if allowed, n, _, _ := l.Take(ctx, uid); !allowed || n != 1 {
		t.Fatal("Reset harus mengembalikan semua jatah")
	}

	// Kunci tanpa TTL (mis. ditulis tangan) mendapat TTL pada Take berikutnya:
	// hitungan tidak pernah terkunci selamanya.
	rdb.Persist(ctx, l.key(uid))
	_, _, _, _ = l.Take(ctx, uid)
	if ttl := rdb.PTTL(ctx, l.key(uid)).Val(); ttl <= 0 {
		t.Fatalf("kunci tanpa TTL harus mendapat TTL, dapat %v", ttl)
	}

	// Percobaan saat terblokir tidak memperpanjang jendela; jendela habis →
	// hitungan mulai dari nol.
	_ = l.Reset(ctx, uid)
	for i := 0; i < 3; i++ {
		_, _, _, _ = l.Take(ctx, uid)
	}
	time.Sleep(1200 * time.Millisecond)
	_, _, retry, _ = l.Take(ctx, uid)
	if retry > 900*time.Millisecond {
		t.Fatalf("percobaan saat terblokir memperpanjang jendela: sisa %v", retry)
	}
	time.Sleep(retry + 150*time.Millisecond)
	if allowed, n, _, _ := l.Take(ctx, uid); !allowed || n != 1 {
		t.Fatalf("setelah jendela habis: allowed=%v n=%d, want true 1", allowed, n)
	}
}

// Take paralel: tepat max pemesanan yang diizinkan, berapa pun jumlah
// permintaan yang datang bersamaan (INCR + PEXPIRE dalam satu skrip Lua).
func TestRedisAttemptLimiter_ParalelTepatMax(t *testing.T) {
	addr := testenv.RedisAddr(t)
	rdb := redis.NewClient(&redis.Options{Addr: addr, DB: 15, PoolSize: 64})
	defer rdb.Close()
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		testenv.Unavailable(t, "redis %s tidak terjangkau: %v", addr, err)
	}
	l := NewRedisAttemptLimiter(rdb, 5, time.Minute)
	l.prefix = "gateway:uji:" + uuid.NewString() + ":"
	uid := uuid.New()
	defer rdb.Del(ctx, l.key(uid))

	var (
		wg      sync.WaitGroup
		allowed atomic.Int64
		start   = make(chan struct{})
	)
	for i := 0; i < 200; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			ok, _, _, err := l.Take(ctx, uid)
			if err != nil {
				t.Error(err)
				return
			}
			if ok {
				allowed.Add(1)
			}
		}()
	}
	close(start)
	wg.Wait()
	if allowed.Load() != 5 {
		t.Fatalf("pemesanan yang diizinkan = %d, want 5", allowed.Load())
	}
}

func testRedis(t *testing.T, pool int) *redis.Client {
	t.Helper()
	addr := testenv.RedisAddr(t)
	rdb := redis.NewClient(&redis.Options{Addr: addr, DB: 15, PoolSize: pool})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		rdb.Close()
		testenv.Unavailable(t, "redis %s tidak terjangkau: %v", addr, err)
	}
	t.Cleanup(func() { rdb.Close() })
	return rdb
}
