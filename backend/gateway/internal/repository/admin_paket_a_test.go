package repository

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/testenv"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// Uji email tanpa peka huruf (000016) dan lapis panjang jatah faktor kedua di
// Postgres (000017). Opt-in lewat GATEWAY_TEST_DATABASE_URL. Kecuali yang
// menuntut GATEWAY_TEST_DATABASE_DISPOSABLE=1, semua tulisan terjadi di dalam
// satu transaksi yang selalu di-ROLLBACK (baris admin uji tidak pernah tersimpan).

func testPool(t *testing.T) (*pgxpool.Pool, context.Context) {
	t.Helper()
	dsn := testenv.DatabaseURL(t)
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	t.Cleanup(cancel)
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	if err := pool.Ping(ctx); err != nil {
		testenv.Unavailable(t, "postgres tidak terjangkau: %v", err)
	}
	return pool, ctx
}

// rollbackTx: transaksi yang tidak pernah di-Commit.
func rollbackTx(t *testing.T, pool *pgxpool.Pool, ctx context.Context) pgx.Tx {
	t.Helper()
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = tx.Rollback(context.Background()) })
	if _, err := tx.Exec(ctx, `SET LOCAL lock_timeout = '3s'; SET LOCAL statement_timeout = '10s'`); err != nil {
		t.Fatal(err)
	}
	return tx
}

// savepoint menjalankan fn di dalam SAVEPOINT yang di-ROLLBACK, supaya galat
// yang diharapkan (mis. pelanggaran unik) tidak menggugurkan transaksi uji.
func savepoint(t *testing.T, tx pgx.Tx, ctx context.Context, fn func(r *AdminUserRepo)) {
	t.Helper()
	sp, err := tx.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = sp.Rollback(ctx) }()
	fn(&AdminUserRepo{pool: sp})
}

func newTestAdmin(t *testing.T, r *AdminUserRepo, ctx context.Context, email string) *model.AdminUser {
	t.Helper()
	u := &model.AdminUser{Email: email, PasswordHash: "x", FullName: "Uji", Role: "admin"}
	if err := r.Create(ctx, u); err != nil {
		t.Fatalf("Create %q: %v", email, err)
	}
	return u
}

func testEmail(tag string) string {
	return "uji-" + tag + "-" + uuid.NewString()[:8] + "@contoh.invalid"
}

// 000016: email unik tanpa peka huruf dan spasi tepi, di Create dan Update,
// dan FindByEmail tanpa peka huruf.
func TestAdminUserRepo_EmailTanpaPekaHuruf(t *testing.T) {
	pool, ctx := testPool(t)
	tx := rollbackTx(t, pool, ctx)
	r := &AdminUserRepo{pool: tx}

	a := newTestAdmin(t, r, ctx, testEmail("a"))
	b := newTestAdmin(t, r, ctx, testEmail("b"))

	got, err := r.FindByEmail(ctx, "  "+strings.ToUpper(a.Email)+" ")
	if err != nil || got == nil || got.ID != a.ID {
		t.Fatalf("FindByEmail huruf besar + spasi: %v %v", got, err)
	}
	for _, v := range []string{strings.ToUpper(a.Email), a.Email + " ", " " + strings.ToUpper(a.Email)} {
		savepoint(t, tx, ctx, func(r *AdminUserRepo) {
			err := r.Create(ctx, &model.AdminUser{Email: v, PasswordHash: "x", FullName: "Uji", Role: "admin"})
			if !errors.Is(err, ErrEmailTaken) {
				t.Fatalf("Create %q: err = %v, want ErrEmailTaken", v, err)
			}
		})
		savepoint(t, tx, ctx, func(r *AdminUserRepo) {
			cur, _ := r.FindByID(ctx, b.ID)
			cur.Email = v
			ok, err := r.Update(ctx, cur, true)
			if ok || !errors.Is(err, ErrEmailTaken) {
				t.Fatalf("Update ke %q: ok=%v err=%v, want ErrEmailTaken", v, ok, err)
			}
		})
	}
	var idx bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM pg_indexes
	    WHERE schemaname = 'public' AND indexname = 'admin_users_email_lower_key')`).Scan(&idx); err != nil || !idx {
		t.Fatalf("indeks admin_users_email_lower_key: %v %v", idx, err)
	}
	if n, err := r.DuplicateEmailGroups(ctx); err != nil || n != 0 {
		t.Fatalf("DuplicateEmailGroups = %d, %v", n, err)
	}
}

// 000017: semantik lapis panjang di SQL (pesan bersyarat, lepas, kosongkan,
// jendela lewat, impor dari Redis lama).
func TestAdminUserRepo_LapisPanjangTOTP(t *testing.T) {
	pool, ctx := testPool(t)
	tx := rollbackTx(t, pool, ctx)
	r := &AdminUserRepo{pool: tx}
	u := newTestAdmin(t, r, ctx, testEmail("totp"))
	const window = 30 * 24 * time.Hour

	if n, retry, err := r.LongFailures(ctx, u.ID, window); err != nil || n != 0 || retry != 0 {
		t.Fatalf("awal: %d %v %v", n, retry, err)
	}
	for i := int64(1); i <= 3; i++ {
		ok, n, retry, err := r.ReserveLongFailure(ctx, u.ID, 3, window)
		if err != nil || !ok || n != i || retry <= window-time.Minute || retry > window {
			t.Fatalf("pesan ke-%d: ok=%v n=%d retry=%v err=%v", i, ok, n, retry, err)
		}
	}
	if ok, _, _, err := r.ReserveLongFailure(ctx, u.ID, 3, window); err != nil || ok {
		t.Fatalf("pesan ke-4 saat batas 3: ok=%v err=%v, want false", ok, err)
	}
	if n, retry, err := r.LongFailures(ctx, u.ID, window); err != nil || n != 3 || retry <= window-time.Minute {
		t.Fatalf("setelah 3: %d %v %v", n, retry, err)
	}
	// Lepas satu (berhasil / galat server): 2, jendela tetap.
	if err := r.ReleaseLongFailure(ctx, u.ID); err != nil {
		t.Fatal(err)
	}
	if n, _, _ := r.LongFailures(ctx, u.ID, window); n != 2 {
		t.Fatalf("setelah lepas: %d, want 2", n)
	}
	// Jendela lewat: dibaca nol, pesan berikutnya memulai jendela baru.
	if _, err := tx.Exec(ctx, `UPDATE public.admin_users SET totp_gagal_panjang_mulai = now() - interval '31 days' WHERE id = $1`, u.ID); err != nil {
		t.Fatal(err)
	}
	if n, retry, _ := r.LongFailures(ctx, u.ID, window); n != 0 || retry != 0 {
		t.Fatalf("jendela lewat: %d %v, want 0", n, retry)
	}
	if ok, n, retry, err := r.ReserveLongFailure(ctx, u.ID, 3, window); err != nil || !ok || n != 1 || retry <= window-time.Minute {
		t.Fatalf("pesan setelah jendela lewat: ok=%v n=%d retry=%v err=%v", ok, n, retry, err)
	}
	// Lepas sampai nol mengosongkan awal jendela; tidak pernah negatif.
	_ = r.ReleaseLongFailure(ctx, u.ID)
	_ = r.ReleaseLongFailure(ctx, u.ID)
	var n int
	var mulai *time.Time
	if err := tx.QueryRow(ctx, `SELECT totp_gagal_panjang, totp_gagal_panjang_mulai FROM public.admin_users WHERE id = $1`, u.ID).Scan(&n, &mulai); err != nil || n != 0 || mulai != nil {
		t.Fatalf("lepas sampai nol: n=%d mulai=%v err=%v", n, mulai, err)
	}
	// Impor dari Redis lama: hitungan terbesar menang, sisa jendela ikut.
	if err := r.ImportLongFailures(ctx, u.ID, 3, time.Hour, window); err != nil {
		t.Fatal(err)
	}
	if n, retry, _ := r.LongFailures(ctx, u.ID, window); n != 3 || retry > time.Hour || retry < 59*time.Minute {
		t.Fatalf("impor: %d %v, want 3 dengan sisa ±1 jam", n, retry)
	}
	if err := r.ImportLongFailures(ctx, u.ID, 2, window, window); err != nil {
		t.Fatal(err)
	}
	if n, _, _ := r.LongFailures(ctx, u.ID, window); n != 3 {
		t.Fatalf("impor hitungan lebih kecil: %d, want tetap 3", n)
	}
	// Kosongkan (pemulihan super admin).
	if err := r.ClearLongFailures(ctx, u.ID); err != nil {
		t.Fatal(err)
	}
	if n, retry, _ := r.LongFailures(ctx, u.ID, window); n != 0 || retry != 0 {
		t.Fatalf("setelah kosongkan: %d %v", n, retry)
	}
	// Admin tidak ada: baca = galat (pembatas gagal tertutup), pesan = false.
	ghost := uuid.New()
	if _, _, err := r.LongFailures(ctx, ghost, window); err == nil {
		t.Fatal("LongFailures admin tak ada harus galat")
	}
	if ok, _, _, err := r.ReserveLongFailure(ctx, ghost, 3, window); err != nil || ok {
		t.Fatalf("ReserveLongFailure admin tak ada: %v %v", ok, err)
	}
}

// Temuan F1 ujung ke ujung: auth.RedisTOTPLimiter dengan lapis panjang di
// Postgres sungguhan. Membuang semua kunci Redis admin itu (eviction) tidak
// membuka penguncian.
func TestRedisTOTPLimiter_PostgresSungguhan_EvictionTidakMembukaKunci(t *testing.T) {
	pool, ctx := testPool(t)
	addr := testenv.RedisAddr(t)
	rdb := redis.NewClient(&redis.Options{Addr: addr, DB: 15})
	t.Cleanup(func() { rdb.Close() })
	if err := rdb.Ping(ctx).Err(); err != nil {
		testenv.Unavailable(t, "redis %s tidak terjangkau: %v", addr, err)
	}
	tx := rollbackTx(t, pool, ctx)
	r := &AdminUserRepo{pool: tx}
	u := newTestAdmin(t, r, ctx, testEmail("evict"))
	keys := []string{"gateway:admin_totp_gagal:" + u.ID.String(), "gateway:admin_totp_gagal_panjang:" + u.ID.String()}
	t.Cleanup(func() { rdb.Del(context.Background(), keys...) })

	lim := auth.NewRedisTOTPLimiter(rdb, r, 5, 15*time.Minute, 4, 30*24*time.Hour)
	for i := 0; i < 4; i++ {
		res, err := lim.Take(ctx, u.ID)
		if err != nil || !res.Allowed {
			t.Fatalf("pesanan ke-%d: %+v %v", i+1, res, err)
		}
	}
	rdb.Del(ctx, keys...) // eviction allkeys-lru
	res, err := lim.Take(ctx, u.ID)
	if err != nil || !res.Locked || res.Long != 4 {
		t.Fatalf("setelah kunci Redis dibuang: %+v %v, want Locked", res, err)
	}
	// Refund (galat server) dan Clear bekerja terhadap SQL sungguhan.
	if err := lim.Clear(ctx, u.ID); err != nil {
		t.Fatal(err)
	}
	if res, _ := lim.Take(ctx, u.ID); !res.Allowed || res.Long != 1 {
		t.Fatalf("setelah Clear: %+v", res)
	}
	if err := lim.Refund(ctx, u.ID); err != nil {
		t.Fatal(err)
	}
	if n, _, _ := r.LongFailures(ctx, u.ID, 30*24*time.Hour); n != 0 {
		t.Fatalf("setelah Refund: %d, want 0", n)
	}
}

// Pesanan paralel lintas koneksi: tepat max yang menang (UPDATE bersyarat
// atomik). Menulis satu baris admin sementara, jadi hanya di DB sekali pakai.
func TestAdminUserRepo_LapisPanjangParalel(t *testing.T) {
	pool, ctx := testPool(t)
	testenv.DatabaseDisposable(t)
	r := NewAdminUserRepo(pool)
	u := newTestAdmin(t, r, ctx, testEmail("paralel"))
	t.Cleanup(func() { _ = r.Delete(context.Background(), u.ID) })

	var won atomic.Int64
	var wg sync.WaitGroup
	start := make(chan struct{})
	for i := 0; i < 60; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			ok, _, _, err := r.ReserveLongFailure(ctx, u.ID, 7, time.Hour)
			if err != nil {
				t.Error(err)
				return
			}
			if ok {
				won.Add(1)
			}
		}()
	}
	close(start)
	wg.Wait()
	if won.Load() != 7 {
		t.Fatalf("pesanan yang menang = %d, want 7", won.Load())
	}
	if n, _, _ := r.LongFailures(ctx, u.ID, time.Hour); n != 7 {
		t.Fatalf("hitungan = %d, want 7", n)
	}
}

// migrateDB membuat database kosong baru di server uji dan memulangkan DSN-nya
// untuk pgx dan untuk golang-migrate (tabel migrasi sama dengan produksi).
// Database dihapus sesudah uji.
func migrateDB(t *testing.T, pool *pgxpool.Pool, ctx context.Context) (dsn, migrateDSN string) {
	t.Helper()
	name := "gw_uji_migrasi_" + strings.ReplaceAll(uuid.NewString()[:8], "-", "")
	if _, err := pool.Exec(ctx, "CREATE DATABASE "+name); err != nil {
		t.Fatalf("CREATE DATABASE: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(context.Background(), "DROP DATABASE IF EXISTS "+name+" WITH (FORCE)")
	})
	u, err := url.Parse(testenv.DatabaseURL(t))
	if err != nil {
		t.Fatal(err)
	}
	u.Path = "/" + name
	dsn = u.String()
	q := u.Query()
	q.Set("x-migrations-table", "gateway_schema_migrations")
	u.RawQuery = q.Encode()
	return dsn, u.String()
}

func migrateTo(t *testing.T, dsn string, version uint) {
	t.Helper()
	m, err := migrate.New("file://../../migrations", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer m.Close()
	if err := m.Migrate(version); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		t.Fatalf("migrasi ke %d: %v", version, err)
	}
}

// 000016 TIDAK BOLEH GAGAL pada data apa pun (gateway os.Exit bila migrasi
// gagal): dengan email kembar, migrasi selesai tanpa indeks dan hanya email yang
// tidak bertabrakan dinormalkan; tanpa kembar, semua dinormalkan dan indeks
// terpasang. Lewat golang-migrate, persis seperti saat gateway start. Juga
// turun 17 → 15 (rollback). Membuat database sementara: hanya di server sekali pakai.
func TestMigrasi000016_000017_TidakPernahGagal(t *testing.T) {
	pool, ctx := testPool(t)
	testenv.DatabaseDisposable(t)

	emails := func(conn *pgxpool.Pool) []string {
		rows, err := conn.Query(ctx, `SELECT email FROM public.admin_users ORDER BY full_name`)
		if err != nil {
			t.Fatal(err)
		}
		defer rows.Close()
		var out []string
		for rows.Next() {
			var e string
			_ = rows.Scan(&e)
			out = append(out, e)
		}
		return out
	}
	hasIndex := func(conn *pgxpool.Pool) bool {
		var ok bool
		_ = conn.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'admin_users_email_lower_key')`).Scan(&ok)
		return ok
	}
	open := func(dsn string) *pgxpool.Pool {
		p, err := pgxpool.New(ctx, dsn)
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(p.Close)
		return p
	}

	for _, tc := range []struct {
		name      string
		seed      []string // email, berurutan full_name a, b, c, ...
		want      []string
		wantIndex bool
	}{
		{"kosong", nil, nil, true},
		{"tanpa kembar", []string{"Master@CoreAsia.ID", " spasi@x.id", "biasa@x.id"},
			[]string{"master@coreasia.id", "spasi@x.id", "biasa@x.id"}, true},
		{"dengan kembar", []string{"y@x.id", "Y@X.ID", " y@x.id ", "Lain@X.ID"},
			[]string{"y@x.id", "Y@X.ID", " y@x.id ", "lain@x.id"}, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			dsn, mdsn := migrateDB(t, pool, ctx)
			migrateTo(t, mdsn, 15)
			db := open(dsn)
			for i, e := range tc.seed {
				if _, err := db.Exec(ctx, `INSERT INTO public.admin_users (email, password_hash, full_name) VALUES ($1, 'x', $2)`,
					e, fmt.Sprintf("%c", 'a'+i)); err != nil {
					t.Fatal(err)
				}
			}
			migrateTo(t, mdsn, 17)
			if got := emails(db); strings.Join(got, "|") != strings.Join(tc.want, "|") {
				t.Fatalf("email setelah 000016: %q, want %q", got, tc.want)
			}
			if hasIndex(db) != tc.wantIndex {
				t.Fatalf("indeks unik terpasang = %v, want %v", hasIndex(db), tc.wantIndex)
			}
			if n, _ := NewAdminUserRepo(db).DuplicateEmailGroups(ctx); (n > 0) == tc.wantIndex {
				t.Fatalf("DuplicateEmailGroups = %d (indeks %v)", n, tc.wantIndex)
			}
			// Rollback: turun ke 15 lalu naik lagi tanpa galat.
			migrateTo(t, mdsn, 15)
			if hasIndex(db) {
				t.Fatal("down 000016 harus membuang indeks")
			}
			migrateTo(t, mdsn, 17)
		})
	}
}
