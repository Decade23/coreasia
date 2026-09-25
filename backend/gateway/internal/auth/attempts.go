package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
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

// LongAttemptStore menyimpan lapis panjang jatah faktor kedua di Postgres
// (kolom admin_users.totp_gagal_panjang*, migrasi 000017; implementasi
// produksi: repository.AdminUserRepo). Bukan di Redis: Redis produksi memakai
// allkeys-lru, dan pihak tanpa akses bisa memenuhi memorinya lewat /login
// dengan email acak sampai kunci lapis panjang milik admin yang sedang diserang
// dibuang, lalu hitungan 30 harinya mulai dari nol.
//
// Jendelanya tetap, dimulai dari kegagalan pertama; jendela yang lewat dibaca
// nol. Semua operasi atomik (satu UPDATE bersyarat per operasi).
type LongAttemptStore interface {
	// LongFailures: hitungan jendela panjang saat ini dan sisa jendelanya.
	// Admin tidak ada = galat.
	LongFailures(ctx context.Context, userID uuid.UUID, window time.Duration) (n int64, retry time.Duration, err error)
	// ReserveLongFailure memesan satu jatah bila hitungan < max. false = habis
	// (atau admin tidak ada), tidak ada yang ditulis.
	ReserveLongFailure(ctx context.Context, userID uuid.UUID, max int64, window time.Duration) (reserved bool, n int64, retry time.Duration, err error)
	// ReleaseLongFailure mengembalikan tepat satu jatah (tidak pernah negatif).
	ReleaseLongFailure(ctx context.Context, userID uuid.UUID) error
	// ClearLongFailures mengosongkan hitungan (pemulihan oleh super admin).
	ClearLongFailures(ctx context.Context, userID uuid.UUID) error
	// ImportLongFailures memindahkan hitungan lama dari Redis (sementara).
	ImportLongFailures(ctx context.Context, userID uuid.UUID, n int64, remaining, window time.Duration) error
}

// RedisTOTPLimiter membatasi percobaan faktor kedua per admin (kode TOTP di
// verify/enable/disable, sandi konfirmasi di /totp/setup dan saat mengganti
// sandi sendiri) dengan dua lapis:
//
//   - pendek (Redis): max percobaan per window (5 per 15 menit), dikembalikan
//     seluruhnya setelah berhasil. Menahan tebakan beruntun. Kehilangan kunci
//     ini (eviction) paling banyak membuka satu jendela 15 menit.
//   - panjang (Postgres, LongAttemptStore): maxLong kegagalan per windowLong
//     (20 per 30 hari), jendela tetap dari kegagalan pertama. Keberhasilan
//     hanya mengembalikan jatahnya sendiri, BUKAN kegagalan sebelumnya. Tanpa
//     lapis ini, pemegang sandi yang sabar mendapat 480 tebakan per hari untuk
//     selamanya (±41% tembus dalam setahun); dengan lapis ini paling banyak
//     maxLong tebakan per windowLong, lalu verifikasi terkunci.
//
// Pola "pesan dulu, baru evaluasi": (1) terkunci? baca lapis panjang; (2) pesan
// lapis pendek (skrip Lua atomik); (3) pesan lapis panjang (UPDATE bersyarat
// atomik). Permintaan paralel tidak bisa menyelinap di antara cek dan catat
// pada lapis mana pun: yang kalah di langkah 3 mendapat Locked. Percobaan yang
// ditahan lapis pendek tidak memakai jatah panjang (tidak dievaluasi), jadi
// banjir permintaan tidak mempercepat penguncian, dan percobaan saat terkunci
// tidak menyentuh lapis pendek. Galat Redis atau Postgres dikembalikan apa
// adanya; pemanggil wajib gagal tertutup.
type RedisTOTPLimiter struct {
	rdb         redis.Cmdable
	long        LongAttemptStore
	shortPrefix string
	// legacyLongPrefix: kunci lapis panjang di Redis sebelum migrasi 000017.
	// Hanya dibaca untuk dipindahkan ke Postgres sekali, lalu dihapus.
	legacyLongPrefix string
	max              int64
	window           time.Duration
	maxLong          int64
	windowLong       time.Duration
}

func NewRedisTOTPLimiter(rdb redis.Cmdable, long LongAttemptStore, max int, window time.Duration, maxLong int, windowLong time.Duration) *RedisTOTPLimiter {
	return &RedisTOTPLimiter{
		rdb:              rdb,
		long:             long,
		shortPrefix:      "gateway:admin_totp_gagal:",
		legacyLongPrefix: "gateway:admin_totp_gagal_panjang:",
		max:              int64(max),
		window:           window,
		maxLong:          int64(maxLong),
		windowLong:       windowLong,
	}
}

func (l *RedisTOTPLimiter) shortKey(userID uuid.UUID) string {
	return l.shortPrefix + userID.String()
}

func (l *RedisTOTPLimiter) legacyLongKey(userID uuid.UUID) string {
	return l.legacyLongPrefix + userID.String()
}

// refundShortScript mengembalikan satu jatah jendela pendek (percobaan yang
// tidak dievaluasi sampai tuntas karena galat server). Tidak pernah negatif,
// TTL tidak diubah.
var refundShortScript = redis.NewScript(`
local v = tonumber(redis.call('GET', KEYS[1]) or '0')
if v > 1 then
  redis.call('DECR', KEYS[1])
elseif v == 1 then
  redis.call('DEL', KEYS[1])
end
return v
`)

// legacyLongScript: {hitungan, sisa ms} kunci lapis panjang Redis lama
// ({0, 0} bila tidak ada).
var legacyLongScript = redis.NewScript(`
local v = tonumber(redis.call('GET', KEYS[1]) or '0')
if v <= 0 then
  return {0, 0}
end
return {v, redis.call('PTTL', KEYS[1])}
`)

// importLegacy memindahkan hitungan lapis panjang Redis lama (sebelum 000017)
// ke Postgres, lalu menghapus kuncinya. Sementara: kunci lama habis TTL-nya
// paling lambat 30 hari sesudah rilis, dan setelah itu langkah ini tidak
// menemukan apa pun. Galat = gagal tertutup (hitungan lama tidak boleh hilang
// diam-diam karena Postgres sedang tidak bisa ditulis).
func (l *RedisTOTPLimiter) importLegacy(ctx context.Context, userID uuid.UUID) error {
	key := l.legacyLongKey(userID)
	res, err := legacyLongScript.Run(ctx, l.rdb, []string{key}).Int64Slice()
	if err != nil {
		return err
	}
	if len(res) != 2 {
		return fmt.Errorf("totp limiter: jawaban skrip tidak terduga: %v", res)
	}
	if res[0] <= 0 {
		return nil
	}
	remaining := time.Duration(res[1]) * time.Millisecond
	if remaining <= 0 || remaining > l.windowLong {
		remaining = l.windowLong
	}
	if err := l.long.ImportLongFailures(ctx, userID, res[0], remaining, l.windowLong); err != nil {
		return err
	}
	return l.rdb.Del(ctx, key).Err()
}

// Take memesan satu percobaan untuk userID. Error Redis (putus, READONLY, OOM)
// atau Postgres dikembalikan apa adanya; pemanggil WAJIB gagal tertutup (tanpa
// pemesanan, kode tidak dievaluasi).
func (l *RedisTOTPLimiter) Take(ctx context.Context, userID uuid.UUID) (AttemptResult, error) {
	if l.long == nil {
		return AttemptResult{}, fmt.Errorf("totp limiter: penyimpan lapis panjang tidak ada")
	}
	if err := l.importLegacy(ctx, userID); err != nil {
		return AttemptResult{}, err
	}
	// 1. Terkunci: kode tidak dievaluasi, lapis pendek tidak disentuh.
	long, lretry, err := l.long.LongFailures(ctx, userID, l.windowLong)
	if err != nil {
		return AttemptResult{}, err
	}
	if long >= l.maxLong {
		return AttemptResult{Locked: true, Long: long, Retry: lretry}, nil
	}
	// 2. Lapis pendek.
	res, err := takeScript.Run(ctx, l.rdb, []string{l.shortKey(userID)}, l.window.Milliseconds()).Int64Slice()
	if err != nil {
		return AttemptResult{}, err
	}
	if len(res) != 2 {
		return AttemptResult{}, fmt.Errorf("totp limiter: jawaban skrip tidak terduga: %v", res)
	}
	n, retry := res[0], time.Duration(res[1])*time.Millisecond
	if n > l.max {
		return AttemptResult{N: n, Long: long, Retry: retry}, nil
	}
	// 3. Lapis panjang. Kalah balapan dengan permintaan paralel yang mengambil
	// jatah terakhir = terkunci (jatah pendek yang sudah terpesan tidak
	// dikembalikan: paling banyak menahan satu percobaan di jendela ini).
	reserved, long, _, err := l.long.ReserveLongFailure(ctx, userID, l.maxLong, l.windowLong)
	if err != nil {
		return AttemptResult{}, err
	}
	if !reserved {
		long, lretry, err = l.long.LongFailures(ctx, userID, l.windowLong)
		if err != nil {
			return AttemptResult{}, err
		}
		return AttemptResult{Locked: true, Long: long, Retry: lretry}, nil
	}
	return AttemptResult{Allowed: true, N: n, Long: long, Retry: retry}, nil
}

// Reset dipanggil setelah kode atau sandi yang benar diterima: jendela pendek
// dikosongkan, dan jatah panjang milik percobaan itu dikembalikan. Kegagalan
// sebelumnya tetap terhitung di jendela panjang.
func (l *RedisTOTPLimiter) Reset(ctx context.Context, userID uuid.UUID) error {
	return errors.Join(
		l.rdb.Del(ctx, l.shortKey(userID)).Err(),
		l.long.ReleaseLongFailure(ctx, userID),
	)
}

// Refund mengembalikan jatah satu percobaan yang tidak bisa dievaluasi sampai
// tuntas karena galat server (rahasia tidak terbuka setelah rotasi JWT_SECRET,
// DB gagal): satu jatah pendek dan satu jatah panjang. Beda dengan Reset,
// kegagalan lain di jendela pendek tetap terhitung.
func (l *RedisTOTPLimiter) Refund(ctx context.Context, userID uuid.UUID) error {
	return errors.Join(
		refundShortScript.Run(ctx, l.rdb, []string{l.shortKey(userID)}).Err(),
		l.long.ReleaseLongFailure(ctx, userID),
	)
}

// Clear menghapus kedua lapis (membuka kunci), termasuk kunci Redis lama.
// Hanya untuk pemulihan oleh super admin: reset TOTP, atau sandi akun itu diganti.
func (l *RedisTOTPLimiter) Clear(ctx context.Context, userID uuid.UUID) error {
	return errors.Join(
		l.rdb.Del(ctx, l.shortKey(userID), l.legacyLongKey(userID)).Err(),
		l.long.ClearLongFailures(ctx, userID),
	)
}
