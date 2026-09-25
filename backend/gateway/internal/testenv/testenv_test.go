package testenv

import (
	"testing"
)

// catatTB meniru testing.TB: Fatalf/Skipf dicatat lalu menghentikan fungsi
// yang diuji (seperti runtime.Goexit pada testing.T), tanpa menghentikan uji.
type catatTB struct {
	testing.TB
	fatal, skip bool
}

type berhenti struct{}

func (c *catatTB) Helper()               {}
func (c *catatTB) Fatalf(string, ...any) { c.fatal = true; panic(berhenti{}) }
func (c *catatTB) Skipf(string, ...any)  { c.skip = true; panic(berhenti{}) }

func jalankan(t *testing.T, fn func(testing.TB)) *catatTB {
	c := &catatTB{TB: t}
	func() {
		defer func() {
			if r := recover(); r != nil {
				if _, ok := r.(berhenti); !ok {
					panic(r)
				}
			}
		}()
		fn(c)
	}()
	return c
}

// Di CI (CI=true) prasyarat uji opt-in yang tidak ada = GAGAL, bukan dilewati:
// penjaga SQL dan Lua tidak boleh diam-diam tidak teruji di jalur rilis. Di
// luar CI dilewati.
func TestUnavailable_GagalDiCILewatiDiLuarCI(t *testing.T) {
	t.Setenv("GATEWAY_TEST_REDIS_ADDR", "")
	for _, k := range []struct {
		ci          string
		fatal, skip bool
	}{
		{"true", true, false},
		{"", false, true},
		{"1", false, true}, // hanya "true" persis (nilai GitHub Actions)
	} {
		t.Setenv("CI", k.ci)
		if c := jalankan(t, func(tb testing.TB) { Unavailable(tb, "uji") }); c.fatal != k.fatal || c.skip != k.skip {
			t.Fatalf("CI=%q Unavailable: fatal=%v skip=%v, want %v/%v", k.ci, c.fatal, c.skip, k.fatal, k.skip)
		}
		if c := jalankan(t, func(tb testing.TB) { RedisAddr(tb) }); c.fatal != k.fatal || c.skip != k.skip {
			t.Fatalf("CI=%q RedisAddr tanpa env: fatal=%v skip=%v, want %v/%v", k.ci, c.fatal, c.skip, k.fatal, k.skip)
		}
	}
}
