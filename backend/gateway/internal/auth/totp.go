package auth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hkdf"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pquerna/otp"
	"github.com/pquerna/otp/hotp"
	"github.com/pquerna/otp/totp"
)

// Parameter TOTP (RFC 6238) yang dipakai console. Harus cocok dengan aplikasi
// authenticator umum (Google Authenticator, 1Password, Authy): SHA1, 6 digit,
// periode 30 detik.
const (
	TOTPIssuer = "CoreAsia Console"
	totpPeriod = 30
	// totpSkew = jumlah langkah yang ditoleransi di kiri-kanan langkah saat ini
	// (jam ponsel yang meleset ±30 detik tetap diterima).
	totpSkew = 1

	// totpKeyInfo adalah label HKDF. Mengganti nilainya = semua rahasia TOTP
	// yang tersimpan tidak bisa dibuka lagi; naikkan versi bersama migrasi data.
	totpKeyInfo   = "coreasia-admin-totp-v1"
	totpEncPrefix = "v1:"
)

// ErrTOTPDecrypt: rahasia tersimpan tidak bisa dibuka. Penyebab paling mungkin:
// JWT_SECRET dirotasi (kunci enkripsi diturunkan darinya) atau baris disalin
// ke admin lain (AAD mengikat ciphertext ke id admin).
var ErrTOTPDecrypt = errors.New("rahasia TOTP tidak dapat didekripsi")

// TOTPCipher mengenkripsi rahasia TOTP dengan AES-256-GCM. Kuncinya diturunkan
// HKDF-SHA256 dari JWT secret, jadi tidak ada env baru yang harus dikelola —
// konsekuensinya, rotasi JWT_SECRET ikut menggugurkan semua pendaftaran TOTP.
type TOTPCipher struct {
	aead cipher.AEAD
}

func NewTOTPCipher(jwtSecret string) (*TOTPCipher, error) {
	if jwtSecret == "" {
		return nil, errors.New("JWT secret kosong: kunci TOTP tidak bisa diturunkan")
	}
	key, err := hkdf.Key(sha256.New, []byte(jwtSecret), nil, totpKeyInfo, 32)
	if err != nil {
		return nil, fmt.Errorf("hkdf: %w", err)
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("aes: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("gcm: %w", err)
	}
	return &TOTPCipher{aead: aead}, nil
}

// totpAAD mengikat ciphertext ke admin pemiliknya: ciphertext yang disalin ke
// baris admin lain gagal dibuka.
func totpAAD(userID uuid.UUID) []byte {
	return []byte("admin_users.totp:" + userID.String())
}

// Seal mengenkripsi rahasia base32 milik userID. Hasil: "v1:" + base64url(nonce‖ciphertext).
func (c *TOTPCipher) Seal(userID uuid.UUID, secret string) (string, error) {
	nonce := make([]byte, c.aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("nonce: %w", err)
	}
	out := c.aead.Seal(nonce, nonce, []byte(secret), totpAAD(userID))
	return totpEncPrefix + base64.RawURLEncoding.EncodeToString(out), nil
}

// Open membuka hasil Seal. Kunci salah, admin salah, atau data rusak → ErrTOTPDecrypt.
func (c *TOTPCipher) Open(userID uuid.UUID, enc string) (string, error) {
	raw, ok := strings.CutPrefix(enc, totpEncPrefix)
	if !ok {
		return "", ErrTOTPDecrypt
	}
	buf, err := base64.RawURLEncoding.DecodeString(raw)
	if err != nil || len(buf) < c.aead.NonceSize()+c.aead.Overhead() {
		return "", ErrTOTPDecrypt
	}
	nonce, ct := buf[:c.aead.NonceSize()], buf[c.aead.NonceSize():]
	plain, err := c.aead.Open(nil, nonce, ct, totpAAD(userID))
	if err != nil {
		return "", ErrTOTPDecrypt
	}
	return string(plain), nil
}

// NewTOTPKey membuat rahasia TOTP baru (160 bit) untuk akun (email admin).
// Mengembalikan rahasia base32 (untuk entri manual) dan URI otpauth:// (untuk QR).
func NewTOTPKey(accountName string) (secret, otpauthURL string, err error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      TOTPIssuer,
		AccountName: accountName,
		Period:      totpPeriod,
		SecretSize:  20,
		Digits:      otp.DigitsSix,
		Algorithm:   otp.AlgorithmSHA1,
	})
	if err != nil {
		return "", "", fmt.Errorf("membuat rahasia TOTP: %w", err)
	}
	return key.Secret(), key.URL(), nil
}

// TOTPStep = langkah waktu RFC 6238 (unix detik / 30) untuk t.
func TOTPStep(t time.Time) int64 {
	return t.Unix() / totpPeriod
}

// NormalizeTOTPCode membuang spasi (aplikasi menampilkan "123 456") dan
// memastikan hasilnya tepat 6 digit ASCII.
func NormalizeTOTPCode(code string) (string, bool) {
	code = strings.Join(strings.Fields(code), "")
	if len(code) != 6 {
		return "", false
	}
	for i := 0; i < len(code); i++ {
		if code[i] < '0' || code[i] > '9' {
			return "", false
		}
	}
	return code, true
}

// VerifyTOTP memeriksa code terhadap secret pada langkah now-1, now, now+1.
// Langkah yang ≤ lastStep dilewati (anti-replay: kode yang sudah pernah diterima
// tidak bisa dipakai lagi). ok=true beserta langkah yang cocok bila diterima;
// langkah itu wajib dicatat pemanggil sebagai totp_last_step yang baru.
func VerifyTOTP(secret, code string, now time.Time, lastStep *int64) (step int64, ok bool, err error) {
	code, valid := NormalizeTOTPCode(code)
	if !valid {
		return 0, false, nil
	}
	opts := hotp.ValidateOpts{Digits: otp.DigitsSix, Algorithm: otp.AlgorithmSHA1}
	cur := TOTPStep(now)
	matched := false
	var matchedStep int64
	for s := cur - totpSkew; s <= cur+totpSkew; s++ {
		if s < 0 || (lastStep != nil && s <= *lastStep) {
			continue
		}
		want, genErr := hotp.GenerateCodeCustom(secret, uint64(s), opts)
		if genErr != nil {
			return 0, false, fmt.Errorf("rahasia TOTP tidak valid: %w", genErr)
		}
		// Tetap periksa semua langkah (tanpa keluar lebih awal) supaya waktu
		// jawab tidak membocorkan langkah mana yang cocok.
		if subtle.ConstantTimeCompare([]byte(want), []byte(code)) == 1 && !matched {
			matched = true
			matchedStep = s
		}
	}
	return matchedStep, matched, nil
}
