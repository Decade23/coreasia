package auth

import (
	"bufio"
	"errors"
	"os"
	"regexp"
	"strings"
	"testing"

	"github.com/coreasia/gateway/internal/config"
)

// repoJWTSecretFiles: berkas TER-COMMIT di monorepo (relatif ke akarnya) yang
// memuat JWT secret contoh. Sengaja daftar tetap, bukan menelusuri folder:
// penelusuran ikut membaca .env lokal yang tidak ter-commit (secret sungguhan).
// Tambahkan berkas baru di sini bila menambah contoh JWT_SECRET di repo.
var repoJWTSecretFiles = []string{
	"backend/gateway/configs/config.yaml",
	"backend/gateway/configs/config.example.yaml",
	".env.prod.example",
	"backend/lms/deployments/.env.example",
	"backend/lms/configs/config.example.yaml",
	"backend/lms/deployments/docker-compose.yml",
	"docker-compose.dev.yml",
	"docs/product/BACKEND_IMPLEMENTATION_PLAN.md",
}

// monorepoRoot: dari backend/gateway/internal/auth.
const monorepoRoot = "../../../../"

var (
	envSecretLine  = regexp.MustCompile(`JWT_SECRET=(\S+)`)
	yamlSecretLine = regexp.MustCompile(`^\s*secret:\s*(\S+)`)
	composeDefault = regexp.MustCompile(`^\$\{[A-Za-z_]+:-([^}]*)\}$`)
)

// repoSecretValues membaca nilai JWT secret di satu berkas. Rujukan variabel
// tanpa nilai bawaan (${JWT_SECRET}) dilewati.
func repoSecretValues(t *testing.T, path string) []string {
	t.Helper()
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()
	var out []string
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := sc.Text()
		m := envSecretLine.FindStringSubmatch(line)
		if m == nil {
			m = yamlSecretLine.FindStringSubmatch(line)
		}
		if m == nil {
			continue
		}
		v := strings.Trim(m[1], `"'`)
		if d := composeDefault.FindStringSubmatch(v); d != nil {
			v = d[1]
		} else if strings.HasPrefix(v, "${") || strings.HasPrefix(v, "`") {
			continue
		}
		out = append(out, v)
	}
	return out
}

// Nilai secret di repo WAJIB ditolak CheckJWTSecret. Uji ini membaca berkasnya
// langsung (nilainya tidak pernah dicetak), jadi mengganti atau menambah
// secret contoh tanpa memperbarui publicJWTSecretFingerprints membuat uji gagal.
func TestCheckJWTSecret_NilaiDiRepoDitolak(t *testing.T) {
	t.Setenv("JWT_SECRET", "")
	os.Unsetenv("JWT_SECRET") // cleanenv menimpa YAML bila env ADA, walau kosong
	cfg, err := config.Load("../../configs/config.yaml")
	if err != nil {
		t.Fatal(err)
	}
	werr := CheckJWTSecret(cfg.JWT.Secret)
	if !errors.Is(werr, ErrWeakJWTSecret) || !strings.Contains(werr.Error(), "config.yaml") {
		t.Fatalf("secret configs/config.yaml harus ditolak sebagai nilai repo, dapat %v", werr)
	}
	if strings.Contains(werr.Error(), cfg.JWT.Secret) {
		t.Fatal("pesan galat tidak boleh memuat nilai secret")
	}

	// Berkas di luar modul gateway dilewati bila uji dijalankan di luar monorepo.
	found := 0
	for _, rel := range repoJWTSecretFiles {
		for i, v := range repoSecretValues(t, monorepoRoot+rel) {
			found++
			if err := CheckJWTSecret(v); !errors.Is(err, ErrWeakJWTSecret) {
				t.Errorf("JWT secret contoh ke-%d di %s (sidik %s) lolos CheckJWTSecret: tambahkan sidiknya ke publicJWTSecretFingerprints",
					i+1, rel, JWTSecretFingerprint(v))
			}
		}
	}
	if found == 0 {
		t.Fatal("tidak ada secret contoh yang terbaca; pola pembacaan rusak")
	}
}

func TestCheckJWTSecret(t *testing.T) {
	if err := CheckJWTSecret(""); !errors.Is(err, ErrWeakJWTSecret) {
		t.Error("kosong harus ditolak")
	}
	if err := CheckJWTSecret(strings.Repeat("a", MinJWTSecretBytes-1)); !errors.Is(err, ErrWeakJWTSecret) {
		t.Error("lebih pendek dari minimum harus ditolak")
	}
	if err := CheckJWTSecret(RandomJWTSecret()); err != nil {
		t.Errorf("secret acak harus diterima: %v", err)
	}
	a, b := RandomJWTSecret(), RandomJWTSecret()
	if a == b || len(a) < MinJWTSecretBytes {
		t.Error("RandomJWTSecret harus acak dan cukup panjang")
	}
	if fp := JWTSecretFingerprint("x"); len(fp) != 10 {
		t.Errorf("sidik = %q, want 10 aksara", fp)
	}
}
