package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
)

// MinJWTSecretBytes: panjang minimum JWT_SECRET di luar development. HS256
// memakai kunci 256 bit; secret yang lebih pendek bisa ditebak luring dari satu
// token yang bocor, dan secret yang sama juga menjadi bahan kunci HKDF untuk
// enkripsi rahasia TOTP.
const MinJWTSecretBytes = 32

// publicJWTSecretFingerprints: sidik sha256 (hex) nilai JWT secret yang ada di
// repo, jadi diketahui siapa pun yang punya akses repo. Hanya sidiknya yang
// disimpan di sini. Uji TestCheckJWTSecret_NilaiDiRepoDitolak membaca setiap
// berkas di repoJWTSecretFiles dan gagal bila ada nilai yang lolos
// CheckJWTSecret, supaya daftar ini ikut diperbarui bila berkas itu berubah.
var publicJWTSecretFingerprints = map[string]string{
	"65381482cc8b432096acee5ad1919756f205ebf56b957365daacb3eaccadd08e": "backend/gateway/configs/config.yaml (ikut dikapalkan di image), config.example.yaml, docker-compose.dev.yml (gateway)",
	"501a2089a9638be70b17452cb4b25ebd4a3cbf277c0dbeb2241c3133a4848222": ".env.prod.example",
	"7a5b87994e7353ad8b0dd3e0b8b1be68a1798291169de4f82bf9180a076fb432": "backend/lms/deployments/.env.example, backend/lms/configs/config.example.yaml",
	"bbf53c22984208a2f42c16a4a14d0280f238cf003c590d9e9b8a23195de04c12": "docker-compose.dev.yml (api LMS), backend/lms/deployments/docker-compose.yml",
	"78a6c76148cb9a58742db50123c5c63dde01cdcadb51683eaad0dc44ae9569b9": "docs/product/BACKEND_IMPLEMENTATION_PLAN.md (docker-compose)",
	"b3009e99479d219bc16be6eb89b385e79cb03c7c12793aa8904e846afde14d9b": "docs/product/BACKEND_IMPLEMENTATION_PLAN.md (config.yaml)",
}

// ErrWeakJWTSecret dibungkus oleh CheckJWTSecret; pesannya tidak pernah memuat nilai secret.
var ErrWeakJWTSecret = errors.New("JWT secret tidak aman")

// JWTSecretFingerprint: 10 aksara pertama sha256 secret, untuk log dan
// pencocokan dengan .env produksi tanpa mencetak nilainya.
func JWTSecretFingerprint(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])[:10]
}

// CheckJWTSecret menolak secret kosong, lebih pendek dari MinJWTSecretBytes,
// atau sama dengan nilai yang ter-commit di repo. Pemanggil (server.go)
// memutuskan akibatnya per lingkungan.
func CheckJWTSecret(secret string) error {
	if secret == "" {
		return fmt.Errorf("%w: kosong (JWT_SECRET tidak di-set)", ErrWeakJWTSecret)
	}
	sum := sha256.Sum256([]byte(secret))
	if src, ok := publicJWTSecretFingerprints[hex.EncodeToString(sum[:])]; ok {
		return fmt.Errorf("%w: sama dengan nilai contoh di %s", ErrWeakJWTSecret, src)
	}
	if len(secret) < MinJWTSecretBytes {
		return fmt.Errorf("%w: %d byte, minimal %d", ErrWeakJWTSecret, len(secret), MinJWTSecretBytes)
	}
	return nil
}

// RandomJWTSecret membuat secret acak 48 byte yang hanya hidup di memori
// proses. Dipakai server.go saat JWT_SECRET ditolak: token yang ditandatangani
// secret lemah (termasuk token rakitan dari nilai di repo) tidak lagi sah.
func RandomJWTSecret() string {
	b := make([]byte, 48)
	_, _ = rand.Read(b) // sejak Go 1.24 crypto/rand.Read tidak pernah mengembalikan error
	return base64.RawURLEncoding.EncodeToString(b)
}
