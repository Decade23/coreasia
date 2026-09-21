package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// RedisAttemptLimiter membatasi percobaan dalam satu jendela tetap yang dimulai
// dari percobaan pertama (satu lapis). Dipakai /login per akun lewat
// NewRedisLoginLimiter. Faktor kedua (TOTP) memakai RedisTOTPLimiter, yang
// menambah lapis jangka panjang. Disimpan di Redis supaya hitungan bertahan
// melewati restart dan berlaku di semua instans gateway.
//
// Polanya "pesan dulu, baru evaluasi": setiap percobaan memesan satu jatah
// lewat Take SEBELUM kode/sandinya diperiksa, dan jatah dikembalikan seluruhnya
// (Reset) hanya setelah berhasil. Tidak ada celah antara cek dan catat, jadi
// permintaan paralel tidak bisa lolos bersama-sama.
type RedisAttemptLimiter struct {
	rdb    redis.Cmdable
	prefix string
	max    int64
	window time.Duration
	// originPrefix/originTTL: asal login yang pernah memasukkan sandi benar
	// (hanya NewRedisLoginLimiter; kosong = fitur mati).
	originPrefix string
	originTTL    time.Duration
}

// NewRedisAttemptLimiter: pembatas satu lapis dengan awalan kunci umum. Kode
// produksi memakai NewRedisLoginLimiter atau NewRedisTOTPLimiter.
func NewRedisAttemptLimiter(rdb redis.Cmdable, max int, window time.Duration) *RedisAttemptLimiter {
	return &RedisAttemptLimiter{
		rdb:    rdb,
		prefix: "gateway:admin_percobaan:",
		max:    int64(max),
		window: window,
	}
}

func (l *RedisAttemptLimiter) key(userID uuid.UUID) string {
	return l.prefix + userID.String()
}

// NewRedisLoginLimiter membatasi percobaan sandi /login per akun, dengan pola
// yang sama (pesan dulu, baru evaluasi). Kuncinya LoginAttemptKey(email), bukan
// id admin: email yang tidak terdaftar ikut dibatasi dengan cara yang sama,
// jadi 429 tidak membocorkan email mana yang terdaftar.
//
// originTTL: berapa lama asal (LoginOriginKey) yang memasukkan sandi benar
// dikenali (RememberOrigin/KnownOrigin), diperpanjang di setiap login berhasil.
func NewRedisLoginLimiter(rdb redis.Cmdable, max int, window, originTTL time.Duration) *RedisAttemptLimiter {
	return &RedisAttemptLimiter{
		rdb:          rdb,
		prefix:       "gateway:admin_login_gagal:",
		max:          int64(max),
		window:       window,
		originPrefix: "gateway:admin_login_asal:",
		originTTL:    originTTL,
	}
}

// LoginAttemptKey: sidik email login (huruf kecil, tanpa spasi tepi). Email
// tidak disimpan apa adanya di Redis.
func LoginAttemptKey(email string) string {
	sum := sha256.Sum256([]byte(strings.ToLower(strings.TrimSpace(email))))
	return hex.EncodeToString(sum[:16])
}

// LoginOriginKey: sidik pasangan (email login, kunci IP klien). Email dan IP
// tidak disimpan apa adanya di Redis.
func LoginOriginKey(email, ipKey string) string {
	sum := sha256.Sum256([]byte(strings.ToLower(strings.TrimSpace(email)) + "\x00" + ipKey))
	return hex.EncodeToString(sum[:16])
}

// RememberOrigin menandai asal (LoginOriginKey) yang baru saja memasukkan sandi
// benar untuk email itu, selama originTTL.
func (l *RedisAttemptLimiter) RememberOrigin(ctx context.Context, key string) error {
	if l.originPrefix == "" {
		return nil
	}
	return l.rdb.Set(ctx, l.originPrefix+key, 1, l.originTTL).Err()
}

// KnownOrigin: asal ini memasukkan sandi benar untuk email itu dalam originTTL
// terakhir.
func (l *RedisAttemptLimiter) KnownOrigin(ctx context.Context, key string) (bool, error) {
	if l.originPrefix == "" {
		return false, nil
	}
	n, err := l.rdb.Exists(ctx, l.originPrefix+key).Result()
	return n == 1, err
}

// takeScript: INCR dan pemasangan TTL dalam satu langkah atomik di Redis.
// TTL hanya dipasang bila kunci belum punya (percobaan pertama, atau kunci
// yang entah bagaimana kehilangan TTL), jadi percobaan saat terblokir tidak
// memperpanjang jendela. Mengembalikan {hitungan, sisa_ms}.
var takeScript = redis.NewScript(`
local n = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {n, ttl}
`)

// Take memesan satu percobaan untuk userID. allowed=false bila jatah jendela
// ini sudah habis (hitungan > max); retry = sisa jendela. n = hitungan setelah
// pemesanan ini (untuk log). Error Redis (putus, READONLY, OOM) dikembalikan
// apa adanya dan pemanggil memutuskan akibatnya. Faktor kedua (TOTP) WAJIB
// gagal tertutup: tanpa pemesanan, kode tidak dievaluasi. /login gagal terbuka
// ke pembatas per IP (lihat AuthHandler.reserveLoginAttempt).
func (l *RedisAttemptLimiter) Take(ctx context.Context, userID uuid.UUID) (allowed bool, n int64, retry time.Duration, err error) {
	return l.TakeKey(ctx, userID.String())
}

// TakeKey sama dengan Take untuk kunci bebas (mis. LoginAttemptKey).
func (l *RedisAttemptLimiter) TakeKey(ctx context.Context, id string) (allowed bool, n int64, retry time.Duration, err error) {
	res, err := takeScript.Run(ctx, l.rdb, []string{l.prefix + id}, l.window.Milliseconds()).Int64Slice()
	if err != nil {
		return false, 0, 0, err
	}
	if len(res) != 2 {
		return false, 0, 0, fmt.Errorf("attempt limiter: jawaban skrip tidak terduga: %v", res)
	}
	n, retry = res[0], time.Duration(res[1])*time.Millisecond
	return n <= l.max, n, retry, nil
}

// Reset menghapus hitungan setelah kode atau sandi yang benar diterima.
func (l *RedisAttemptLimiter) Reset(ctx context.Context, userID uuid.UUID) error {
	return l.rdb.Del(ctx, l.key(userID)).Err()
}

// ResetKey sama dengan Reset untuk kunci bebas.
func (l *RedisAttemptLimiter) ResetKey(ctx context.Context, id string) error {
	return l.rdb.Del(ctx, l.prefix+id).Err()
}

// ───────────────────────── faktor kedua: dua lapis ─────────────────────────

// AttemptResult adalah hasil satu pemesanan jatah faktor kedua.
type AttemptResult struct {
	// Allowed: jatah terpesan; kode/sandi boleh dievaluasi.
	Allowed bool
	// Locked: jatah jangka panjang habis. Tidak pulih dalam hitungan menit:
	// menunggu jendela panjang berakhir, atau dibuka super admin (Clear).
	Locked bool
	// N: hitungan jendela pendek setelah pemesanan ini (0 bila Locked).
	N int64
	// Long: percobaan yang belum dikembalikan (= gagal) di jendela panjang,
	// termasuk pemesanan ini bila Allowed.
	Long int64
	// Retry: sisa jendela yang menahan (pendek, atau panjang bila Locked).
	Retry time.Duration
}

// RedisTOTPLimiter membatasi percobaan faktor kedua per admin (kode TOTP di
// verify/enable/disable, sandi konfirmasi di /totp/setup dan saat mengganti
// sandi sendiri) dengan dua lapis:
//
//   - pendek: max percobaan per window (5 per 15 menit), dikembalikan
//     seluruhnya setelah berhasil. Menahan tebakan beruntun.
//   - panjang: maxLong kegagalan per windowLong (20 per 30 hari), jendela tetap
//     dari kegagalan pertama. Keberhasilan hanya mengembalikan jatahnya
//     sendiri, BUKAN kegagalan sebelumnya. Tanpa lapis ini, pemegang sandi
//     yang sabar mendapat 480 tebakan per hari untuk selamanya (±41% tembus
//     dalam setahun); dengan lapis ini paling banyak maxLong tebakan per
//     windowLong, lalu verifikasi terkunci.
//
// Pola "pesan dulu, baru evaluasi" berlaku untuk kedua lapis dalam satu skrip
// Lua: permintaan paralel tidak bisa menyelinap di antara cek dan catat.
// Percobaan yang ditahan lapis pendek tidak memakai jatah panjang (tidak
// dievaluasi), jadi banjir permintaan tidak mempercepat penguncian.
type RedisTOTPLimiter struct {
	rdb         redis.Cmdable
	shortPrefix string
	longPrefix  string
	max         int64
	window      time.Duration
	maxLong     int64
	windowLong  time.Duration
}

func NewRedisTOTPLimiter(rdb redis.Cmdable, max int, window time.Duration, maxLong int, windowLong time.Duration) *RedisTOTPLimiter {
	return &RedisTOTPLimiter{
		rdb:         rdb,
		shortPrefix: "gateway:admin_totp_gagal:",
		longPrefix:  "gateway:admin_totp_gagal_panjang:",
		max:         int64(max),
		window:      window,
		maxLong:     int64(maxLong),
		windowLong:  windowLong,
	}
}

func (l *RedisTOTPLimiter) keys(userID uuid.UUID) []string {
	id := userID.String()
	return []string{l.shortPrefix + id, l.longPrefix + id}
}

// takeTOTPScript memesan satu jatah di kedua lapis secara atomik.
// KEYS = {pendek, panjang}; ARGV = {ms pendek, maks pendek, ms panjang, maks panjang}.
// Memulangkan {status, n pendek, sisa ms, n panjang}; status 0 = boleh,
// 1 = jendela pendek habis, 2 = terkunci (jatah panjang habis).
// TTL hanya dipasang bila kunci belum punya, jadi percobaan saat tertahan tidak
// memperpanjang jendela, dan kunci tanpa TTL tidak pernah abadi.
var takeTOTPScript = redis.NewScript(`
local long = tonumber(redis.call('GET', KEYS[2]) or '0')
if long >= tonumber(ARGV[4]) then
  local lttl = redis.call('PTTL', KEYS[2])
  if lttl < 0 then
    redis.call('PEXPIRE', KEYS[2], ARGV[3])
    lttl = tonumber(ARGV[3])
  end
  return {2, 0, lttl, long}
end
local n = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
if n > tonumber(ARGV[2]) then
  return {1, n, ttl, long}
end
long = redis.call('INCR', KEYS[2])
if redis.call('PTTL', KEYS[2]) < 0 then
  redis.call('PEXPIRE', KEYS[2], ARGV[3])
end
return {0, n, ttl, long}
`)

// releaseTOTPScript: berhasil → jendela pendek dihapus, dan tepat satu jatah
// panjang (milik percobaan yang berhasil) dikembalikan. Tidak pernah negatif.
var releaseTOTPScript = redis.NewScript(`
redis.call('DEL', KEYS[1])
local v = tonumber(redis.call('GET', KEYS[2]) or '0')
if v > 1 then
  redis.call('DECR', KEYS[2])
elseif v == 1 then
  redis.call('DEL', KEYS[2])
end
return v
`)

// Take memesan satu percobaan untuk userID. Error Redis (putus, READONLY, OOM)
// dikembalikan apa adanya; pemanggil WAJIB gagal tertutup (tanpa pemesanan,
// kode tidak dievaluasi).
func (l *RedisTOTPLimiter) Take(ctx context.Context, userID uuid.UUID) (AttemptResult, error) {
	res, err := takeTOTPScript.Run(ctx, l.rdb, l.keys(userID),
		l.window.Milliseconds(), l.max, l.windowLong.Milliseconds(), l.maxLong).Int64Slice()
	if err != nil {
		return AttemptResult{}, err
	}
	if len(res) != 4 {
		return AttemptResult{}, fmt.Errorf("totp limiter: jawaban skrip tidak terduga: %v", res)
	}
	return AttemptResult{
		Allowed: res[0] == 0,
		Locked:  res[0] == 2,
		N:       res[1],
		Retry:   time.Duration(res[2]) * time.Millisecond,
		Long:    res[3],
	}, nil
}

// Reset dipanggil setelah kode atau sandi yang benar diterima: jendela pendek
// dikosongkan, dan jatah panjang milik percobaan itu dikembalikan. Kegagalan
// sebelumnya tetap terhitung di jendela panjang.
func (l *RedisTOTPLimiter) Reset(ctx context.Context, userID uuid.UUID) error {
	return releaseTOTPScript.Run(ctx, l.rdb, l.keys(userID)).Err()
}

// Clear menghapus kedua lapis (membuka kunci). Hanya untuk pemulihan oleh
// super admin: reset TOTP, atau sandi akun itu diganti.
func (l *RedisTOTPLimiter) Clear(ctx context.Context, userID uuid.UUID) error {
	return l.rdb.Del(ctx, l.keys(userID)...).Err()
}
