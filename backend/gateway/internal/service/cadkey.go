package service

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
)

// CADKeySigner menerbitkan license key CAD yang dapat diverifikasi offline oleh app —
// format identik dengan tools gen-license (app: license.py verify_license_key):
//
//	"<base64url(payloadJSON)>.<base64url(ed25519 signature)>"
//
// payloadJSON = JSON object (kunci ter-sortir, compact) berisi minimal {"email","tier"};
// boleh ada "exp" (epoch, untuk day-pass) dan "n" (nonce, agar key unik & reissue aman).
// App memverifikasi signature atas BYTE payload mentah (bukan hasil re-serialize), lalu
// membaca email/tier/exp dan mengabaikan field lain — jadi nonce aman.
//
// SECURITY: seed private Ed25519 dimuat dari env CAD_LICENSE_SIGNING_KEY (base64url, 32 byte)
// dan HARUS berpasangan dengan LICENSE_PUBKEY yang di-embed di app.
type CADKeySigner struct{ priv ed25519.PrivateKey }

// NewCADKeySigner membangun signer dari seed base64url (32 byte). Return (nil,nil) bila
// seed kosong → fitur generate dinonaktifkan (handler menolak dengan pesan jelas).
func NewCADKeySigner(seedB64 string) (*CADKeySigner, error) {
	seedB64 = strings.TrimRight(strings.TrimSpace(seedB64), "=")
	if seedB64 == "" {
		return nil, nil
	}
	seed, err := base64.RawURLEncoding.DecodeString(seedB64)
	if err != nil {
		return nil, errors.New("CAD signing key bukan base64url yang valid")
	}
	if len(seed) != ed25519.SeedSize {
		return nil, errors.New("CAD signing key harus seed ed25519 32-byte")
	}
	return &CADKeySigner{priv: ed25519.NewKeyFromSeed(seed)}, nil
}

// PublicKeyB64 mengembalikan public key (base64url tanpa padding) — untuk verifikasi
// bahwa seed yang dikonfigurasi cocok dengan LICENSE_PUBKEY app.
func (s *CADKeySigner) PublicKeyB64() string {
	pub := s.priv.Public().(ed25519.PublicKey)
	return base64.RawURLEncoding.EncodeToString(pub)
}

// Sign membuat & menandatangani satu license key. exp=0 → lifetime (tanpa field exp).
func (s *CADKeySigner) Sign(email, tier string, exp int64) (string, error) {
	if email == "" {
		return "", errors.New("email wajib diisi")
	}
	if tier == "" {
		tier = "lifetime"
	}
	nb := make([]byte, 6)
	if _, err := rand.Read(nb); err != nil {
		return "", err
	}
	m := map[string]any{"email": email, "tier": tier, "n": hex.EncodeToString(nb)}
	if exp > 0 {
		m["exp"] = exp
	}
	payload, err := json.Marshal(m) // map → kunci ter-sortir + compact
	if err != nil {
		return "", err
	}
	sig := ed25519.Sign(s.priv, payload)
	return base64.RawURLEncoding.EncodeToString(payload) + "." + base64.RawURLEncoding.EncodeToString(sig), nil
}
