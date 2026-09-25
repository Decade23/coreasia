package auth

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// memLong: LongAttemptStore di memori, meniru SQL AdminUserRepo (jendela tetap
// dari kegagalan pertama, yang lewat dibaca nol; semua operasi atomik di bawah
// satu mutex). Uji SQL-nya sendiri ada di internal/repository.
type memLong struct {
	mu    sync.Mutex
	n     map[uuid.UUID]int64
	start map[uuid.UUID]time.Time
	down  bool // meniru Postgres tidak bisa ditulis
}

func newMemLong() *memLong {
	return &memLong{n: map[uuid.UUID]int64{}, start: map[uuid.UUID]time.Time{}}
}

func (m *memLong) cur(id uuid.UUID, window time.Duration) int64 {
	if s, ok := m.start[id]; ok && !time.Now().Before(s.Add(window)) {
		delete(m.start, id)
		m.n[id] = 0
	}
	return m.n[id]
}

func (m *memLong) retry(id uuid.UUID, window time.Duration) time.Duration {
	if s, ok := m.start[id]; ok {
		return time.Until(s.Add(window))
	}
	return 0
}

func (m *memLong) LongFailures(_ context.Context, id uuid.UUID, window time.Duration) (int64, time.Duration, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.down {
		return 0, 0, errors.New("postgres mati")
	}
	return m.cur(id, window), m.retry(id, window), nil
}

func (m *memLong) ReserveLongFailure(_ context.Context, id uuid.UUID, max int64, window time.Duration) (bool, int64, time.Duration, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.down {
		return false, 0, 0, errors.New("postgres mati")
	}
	if m.cur(id, window) >= max {
		return false, 0, 0, nil
	}
	if _, ok := m.start[id]; !ok {
		m.start[id] = time.Now()
	}
	m.n[id]++
	return true, m.n[id], m.retry(id, window), nil
}

func (m *memLong) ReleaseLongFailure(_ context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.n[id] > 0 {
		m.n[id]--
		if m.n[id] == 0 {
			delete(m.start, id)
		}
	}
	return nil
}

func (m *memLong) ClearLongFailures(_ context.Context, id uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.n, id)
	delete(m.start, id)
	return nil
}

func (m *memLong) ImportLongFailures(_ context.Context, id uuid.UUID, n int64, remaining, window time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.down {
		return errors.New("postgres mati")
	}
	if m.cur(id, window) == 0 {
		m.n[id], m.start[id] = n, time.Now().Add(remaining-window)
	} else if n > m.n[id] {
		m.n[id] = n
	}
	return nil
}

func (m *memLong) count(id uuid.UUID) int64 {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.n[id]
}

func newTestTOTPLimiter(rdb redis.Cmdable, long LongAttemptStore, max int, window time.Duration, maxLong int, windowLong time.Duration) *RedisTOTPLimiter {
	l := NewRedisTOTPLimiter(rdb, long, max, window, maxLong, windowLong)
	p := "gateway:uji:" + uuid.NewString() + ":"
	l.shortPrefix, l.legacyLongPrefix = p+"pendek:", p+"panjang:"
	return l
}

// Dua lapis terhadap Redis sungguhan (lapis pendek) dan penyimpan lapis panjang
// (opt-in; DB 15, kunci acak dihapus sesudahnya).
func TestRedisTOTPLimiter_DuaLapis(t *testing.T) {
	rdb := testRedis(t, 10)
	ctx := context.Background()
	long := newMemLong()
	l := newTestTOTPLimiter(rdb, long, 3, 400*time.Millisecond, 5, time.Minute)
	uid := uuid.New()
	defer l.Clear(ctx, uid)

	for i := int64(1); i <= 3; i++ {
		r, err := l.Take(ctx, uid)
		if err != nil || !r.Allowed || r.N != i || r.Long != i {
			t.Fatalf("Take ke-%d: %+v %v", i, r, err)
		}
	}
	// Lapis pendek menahan; jatah panjang TIDAK dipakai percobaan yang ditahan.
	r, _ := l.Take(ctx, uid)
	if r.Allowed || r.Locked || r.N != 4 || r.Long != 3 || r.Retry <= 0 || r.Retry > 400*time.Millisecond {
		t.Fatalf("Take saat jendela pendek habis: %+v", r)
	}
	if long.count(uid) != 3 {
		t.Fatalf("jendela panjang = %d, want 3", long.count(uid))
	}
	// Berhasil: jendela pendek kosong, hanya satu jatah panjang kembali.
	if err := l.Reset(ctx, uid); err != nil {
		t.Fatal(err)
	}
	if n, _ := rdb.Exists(ctx, l.shortKey(uid)).Result(); n != 0 {
		t.Fatal("Reset harus mengosongkan jendela pendek")
	}
	if long.count(uid) != 2 {
		t.Fatalf("setelah berhasil, jendela panjang = %d, want 2", long.count(uid))
	}
	// Dua pesanan lagi (panjang 3, 4), jendela pendek habis, lalu satu lagi (5 = batas).
	for i := 0; i < 2; i++ {
		if r, _ := l.Take(ctx, uid); !r.Allowed {
			t.Fatalf("pesanan: %+v", r)
		}
	}
	time.Sleep(450 * time.Millisecond)
	if r, _ := l.Take(ctx, uid); !r.Allowed || r.Long != 5 {
		t.Fatalf("pesanan ke-5 jendela panjang: %+v", r)
	}
	// Terkunci: jendela pendek baru pun tidak membuka.
	time.Sleep(450 * time.Millisecond)
	r, _ = l.Take(ctx, uid)
	if r.Allowed || !r.Locked || r.Long != 5 || r.Retry <= 400*time.Millisecond || r.Retry > time.Minute {
		t.Fatalf("setelah 5 kegagalan: %+v", r)
	}
	if n, _ := rdb.Exists(ctx, l.shortKey(uid)).Result(); n != 0 {
		t.Fatal("percobaan saat terkunci tidak menyentuh jendela pendek")
	}
	// Clear (pemulihan super admin) membuka keduanya.
	if err := l.Clear(ctx, uid); err != nil {
		t.Fatal(err)
	}
	if r, _ := l.Take(ctx, uid); !r.Allowed || r.N != 1 || r.Long != 1 {
		t.Fatalf("setelah Clear: %+v", r)
	}
	// Reset tanpa pesanan tidak pernah membuat hitungan negatif.
	_ = l.Clear(ctx, uid)
	_ = l.Reset(ctx, uid)
	if long.count(uid) != 0 {
		t.Fatalf("Reset tanpa pesanan: jendela panjang = %d", long.count(uid))
	}
}

// Temuan F1: kunci Redis bisa dibuang eviction allkeys-lru (banjir /login tanpa
// autentikasi). Kunci lapis panjang kini tidak di Redis, jadi membuang SEMUA
// kunci Redis admin itu tidak membuka penguncian 30 hari.
func TestRedisTOTPLimiter_EvictionRedisTidakMembukaKunci(t *testing.T) {
	rdb := testRedis(t, 10)
	ctx := context.Background()
	long := newMemLong()
	l := newTestTOTPLimiter(rdb, long, 3, time.Minute, 5, time.Hour)
	uid := uuid.New()
	defer l.Clear(ctx, uid)

	for i := 0; i < 5; i++ {
		if r, err := l.Take(ctx, uid); err != nil || !r.Allowed {
			t.Fatalf("pesanan ke-%d: %+v %v", i+1, r, err)
		}
		// Jendela pendek dibuang (eviction atau habis): lapis panjang tetap.
		rdb.Del(ctx, l.shortKey(uid), l.legacyLongKey(uid))
	}
	rdb.Del(ctx, l.shortKey(uid), l.legacyLongKey(uid))
	r, err := l.Take(ctx, uid)
	if err != nil || !r.Locked || r.Allowed || r.Long != 5 {
		t.Fatalf("setelah semua kunci Redis dibuang: %+v %v, want Locked", r, err)
	}
}

// Galat server (Refund): satu jatah pendek dan satu jatah panjang kembali;
// kegagalan lain di jendela pendek tetap terhitung.
func TestRedisTOTPLimiter_RefundMengembalikanSatuJatah(t *testing.T) {
	rdb := testRedis(t, 10)
	ctx := context.Background()
	long := newMemLong()
	l := newTestTOTPLimiter(rdb, long, 3, time.Minute, 5, time.Hour)
	uid := uuid.New()
	defer l.Clear(ctx, uid)

	for i := 0; i < 2; i++ {
		if r, _ := l.Take(ctx, uid); !r.Allowed {
			t.Fatalf("pesanan: %+v", r)
		}
	}
	if err := l.Refund(ctx, uid); err != nil {
		t.Fatal(err)
	}
	if v, _ := rdb.Get(ctx, l.shortKey(uid)).Int64(); v != 1 {
		t.Fatalf("jendela pendek setelah Refund = %d, want 1", v)
	}
	if long.count(uid) != 1 {
		t.Fatalf("jendela panjang setelah Refund = %d, want 1", long.count(uid))
	}
	// 20 galat server beruntun tidak pernah mengunci.
	for i := 0; i < 20; i++ {
		r, err := l.Take(ctx, uid)
		if err != nil || !r.Allowed {
			t.Fatalf("galat server ke-%d: %+v %v", i+1, r, err)
		}
		_ = l.Refund(ctx, uid)
	}
	if long.count(uid) != 1 {
		t.Fatalf("galat server memakan jatah panjang: %d", long.count(uid))
	}
	// Refund tanpa pesanan tidak pernah negatif.
	_ = l.Clear(ctx, uid)
	_ = l.Refund(ctx, uid)
	if n, _ := rdb.Exists(ctx, l.shortKey(uid)).Result(); n != 0 || long.count(uid) != 0 {
		t.Fatalf("Refund tanpa pesanan: kunci pendek %d, panjang %d", n, long.count(uid))
	}
}

// Hitungan lapis panjang Redis lama (sebelum 000017) dipindah ke penyimpan
// lapis panjang pada Take pertama, lalu kuncinya dihapus: akun yang terkunci
// sebelum rilis tetap terkunci sesudahnya.
func TestRedisTOTPLimiter_ImporHitunganRedisLama(t *testing.T) {
	rdb := testRedis(t, 10)
	ctx := context.Background()
	long := newMemLong()
	l := newTestTOTPLimiter(rdb, long, 3, time.Minute, 5, time.Hour)
	uid := uuid.New()
	defer l.Clear(ctx, uid)

	rdb.Set(ctx, l.legacyLongKey(uid), 5, 30*time.Minute)
	r, err := l.Take(ctx, uid)
	if err != nil || !r.Locked || r.Long != 5 || r.Retry <= 29*time.Minute || r.Retry > 30*time.Minute {
		t.Fatalf("akun terkunci di Redis lama: %+v %v, want Locked dengan sisa ±30 menit", r, err)
	}
	if n, _ := rdb.Exists(ctx, l.legacyLongKey(uid)).Result(); n != 0 {
		t.Fatal("kunci Redis lama harus dihapus setelah dipindah")
	}
	// Hitungan sebagian: dilanjutkan, bukan mulai dari nol.
	_ = l.Clear(ctx, uid)
	rdb.Set(ctx, l.legacyLongKey(uid), 3, time.Hour)
	if r, _ := l.Take(ctx, uid); !r.Allowed || r.Long != 4 {
		t.Fatalf("hitungan lama 3: %+v, want Allowed Long=4", r)
	}
	// Postgres gagal ditulis: gagal tertutup, kunci lama tidak dihapus.
	_ = l.Clear(ctx, uid)
	rdb.Set(ctx, l.legacyLongKey(uid), 2, time.Hour)
	long.down = true
	if _, err := l.Take(ctx, uid); err == nil {
		t.Fatal("impor gagal harus menjadi galat (gagal tertutup)")
	}
	if n, _ := rdb.Exists(ctx, l.legacyLongKey(uid)).Result(); n != 1 {
		t.Fatal("kunci lama tidak boleh hilang sebelum hitungannya tersimpan")
	}
	long.down = false
}

// Paralel: tepat max pesanan per jendela pendek, dan total tepat maxLong
// melintasi banyak jendela, berapa pun paralelismenya.
func TestRedisTOTPLimiter_ParalelTepatBatas(t *testing.T) {
	rdb := testRedis(t, 64)
	ctx := context.Background()
	l := newTestTOTPLimiter(rdb, newMemLong(), 5, 250*time.Millisecond, 12, time.Minute)
	uid := uuid.New()
	defer l.Clear(ctx, uid)

	var allowed atomic.Int64
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		var wg sync.WaitGroup
		start := make(chan struct{})
		var round atomic.Int64
		for i := 0; i < 50; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				<-start
				r, err := l.Take(ctx, uid)
				if err != nil {
					t.Error(err)
					return
				}
				if r.Allowed {
					round.Add(1)
				}
			}()
		}
		close(start)
		wg.Wait()
		if round.Load() > 5 {
			t.Fatalf("satu jendela pendek mengizinkan %d pesanan, batas 5", round.Load())
		}
		allowed.Add(round.Load())
		if allowed.Load() >= 12 {
			break
		}
		time.Sleep(300 * time.Millisecond)
	}
	time.Sleep(300 * time.Millisecond)
	if r, _ := l.Take(ctx, uid); !r.Locked {
		t.Fatalf("setelah jatah panjang habis harus terkunci: %+v", r)
	}
	if allowed.Load() != 12 {
		t.Fatalf("total pesanan yang diizinkan = %d, want 12", allowed.Load())
	}
}

// Galat penyimpan lapis panjang = galat Take (pemanggil gagal tertutup, 503).
func TestRedisTOTPLimiter_PostgresMatiGagalTertutup(t *testing.T) {
	rdb := testRedis(t, 10)
	ctx := context.Background()
	long := newMemLong()
	long.down = true
	l := newTestTOTPLimiter(rdb, long, 3, time.Minute, 5, time.Hour)
	uid := uuid.New()
	defer l.Clear(ctx, uid)
	if r, err := l.Take(ctx, uid); err == nil || r.Allowed {
		t.Fatalf("Postgres mati: %+v %v, want galat", r, err)
	}
	if _, err := NewRedisTOTPLimiter(rdb, nil, 3, time.Minute, 5, time.Hour).Take(ctx, uid); err == nil {
		t.Fatal("tanpa penyimpan lapis panjang harus galat")
	}
}
