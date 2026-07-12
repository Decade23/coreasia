package service

// Cross-check env-gated (di-skip tanpa env — aman di CI): pastikan seed Mounter di
// mesin owner menghasilkan pubkey yang sama dengan yang di-embed di app Mounter, dan
// cetak satu key contoh untuk diverifikasi tools/license-verify.swift (repo mounter).
// Pakai ulang saat rotasi key:
//   MOUNTER_SEED_FILE=<path seed> MOUNTER_EXPECT_PUBKEY=<pubkey app> \
//     go test ./internal/service/ -run TestMounterSeedCrossCheck -v

import (
	"fmt"
	"os"
	"strings"
	"testing"
)

func TestMounterSeedCrossCheck(t *testing.T) {
	seedFile := os.Getenv("MOUNTER_SEED_FILE")
	wantPub := os.Getenv("MOUNTER_EXPECT_PUBKEY")
	if seedFile == "" || wantPub == "" {
		t.Skip("set MOUNTER_SEED_FILE dan MOUNTER_EXPECT_PUBKEY untuk menjalankan cross-check")
	}
	raw, err := os.ReadFile(seedFile)
	if err != nil {
		t.Fatalf("baca seed: %v", err)
	}
	signer, err := NewCADKeySigner(strings.TrimSpace(string(raw)))
	if err != nil {
		t.Fatalf("NewCADKeySigner: %v", err)
	}
	if signer == nil {
		t.Fatal("signer nil (seed kosong?)")
	}
	if got := signer.PublicKeyB64(); got != wantPub {
		t.Fatalf("pubkey TIDAK cocok dengan yang di-embed di app:\n  got  %s\n  want %s", got, wantPub)
	}
	key, err := signer.Sign("crosscheck@coreasia.id", "lifetime", 0)
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	fmt.Printf("CROSSCHECK_PUBKEY_MATCH=true\nCROSSCHECK_SAMPLE_KEY=%s\n", key)
}
