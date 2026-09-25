// Package testenv menyediakan layanan sungguhan untuk uji opt-in (Postgres dan
// Redis sekali pakai, lihat README dan .github/workflows/build-gateway.yml).
//
// Di luar CI, uji yang layanannya tidak tersedia dilewati, jadi `go test ./...`
// tanpa layanan tetap hijau. Di CI (CI=true) uji itu GAGAL: uji yang menjaga
// SQL anti-replay, CAS token_version, dan skrip Lua pembatas tidak boleh
// diam-diam dilewati di jalur rilis.
package testenv

import (
	"os"
	"testing"
)

// InCI: dijalankan di CI (GitHub Actions menyetel CI=true).
func InCI() bool {
	return os.Getenv("CI") == "true"
}

// Unavailable: prasyarat uji opt-in tidak terpenuhi. Skip di luar CI, gagal di CI.
func Unavailable(t testing.TB, format string, args ...any) {
	t.Helper()
	if InCI() {
		t.Fatalf("CI=true, uji opt-in wajib berjalan: "+format, args...)
	}
	t.Skipf(format, args...)
}

// RedisAddr: GATEWAY_TEST_REDIS_ADDR (mis. localhost:6380).
func RedisAddr(t testing.TB) string {
	t.Helper()
	addr := os.Getenv("GATEWAY_TEST_REDIS_ADDR")
	if addr == "" {
		Unavailable(t, "GATEWAY_TEST_REDIS_ADDR tidak di-set")
	}
	return addr
}

// DatabaseURL: GATEWAY_TEST_DATABASE_URL (Postgres yang sudah dimigrasi).
func DatabaseURL(t testing.TB) string {
	t.Helper()
	dsn := os.Getenv("GATEWAY_TEST_DATABASE_URL")
	if dsn == "" {
		Unavailable(t, "GATEWAY_TEST_DATABASE_URL tidak di-set")
	}
	return dsn
}

// DatabaseDisposable: GATEWAY_TEST_DATABASE_DISPOSABLE=1 menandai DB uji sekali
// pakai (CI, container lokal). Hanya di DB seperti itu uji boleh membuat baris
// admin sungguhan (uji paralel lintas transaksi); uji lain tidak pernah
// menyimpan perubahan.
func DatabaseDisposable(t testing.TB) {
	t.Helper()
	if os.Getenv("GATEWAY_TEST_DATABASE_DISPOSABLE") != "1" {
		Unavailable(t, "GATEWAY_TEST_DATABASE_DISPOSABLE=1 tidak di-set (uji ini menulis baris admin sementara)")
	}
}
