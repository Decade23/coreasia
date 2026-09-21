package rbac

import (
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"testing"
)

var izinCashflow = []Permission{CashflowView, CashflowPII, CashflowInvestigasi, CashflowTindak, CashflowEkspor}

// super_admin memegang kelima izin CashFlow (K11).
func TestCashflowSuperAdminSemua(t *testing.T) {
	for _, p := range izinCashflow {
		if !HasPermission("super_admin", p) {
			t.Errorf("super_admin tidak memegang %s", p)
		}
	}
}

// K11: peran selain super_admin PALING JAUH cashflow:view + cashflow:pii, dan
// pii tanpa view tidak masuk akal (Nitro tidak mencetak sesi tanpa view).
func TestCashflowPeranLainPalingJauhViewPII(t *testing.T) {
	for peran := range RolePermissions {
		if peran == "super_admin" {
			continue
		}
		for _, p := range []Permission{CashflowInvestigasi, CashflowTindak, CashflowEkspor} {
			if HasPermission(peran, p) {
				t.Errorf("%s memegang %s — K11 membatasi peran lain ke view + pii", peran, p)
			}
		}
		if HasPermission(peran, CashflowPII) && !HasPermission(peran, CashflowView) {
			t.Errorf("%s memegang cashflow:pii tanpa cashflow:view", peran)
		}
	}
}

func TestCashflowNilaiIzin(t *testing.T) {
	want := []string{"cashflow:view", "cashflow:pii", "cashflow:investigasi", "cashflow:tindak", "cashflow:ekspor"}
	for i, p := range izinCashflow {
		if string(p) != want[i] {
			t.Errorf("izin %d = %q, want %q (nilai ini dibaca Postgres konsol_boleh)", i, p, want[i])
		}
	}
	got := map[string]bool{}
	for _, p := range PermissionsForRole("super_admin") {
		got[p] = true
	}
	for _, w := range want {
		if !got[w] {
			t.Errorf("PermissionsForRole(super_admin) tanpa %s", w)
		}
	}
}

// Paritas dengan cermin landing (utils/rbac.ts). Berkasnya di repo yang sama
// (frontend/landing); bila tidak ada (checkout gateway saja), uji dilewati.
func TestParitasDenganLanding(t *testing.T) {
	jalur := filepath.Join("..", "..", "..", "..", "frontend", "landing", "utils", "rbac.ts")
	isi, err := os.ReadFile(jalur)
	if err != nil {
		t.Skipf("utils/rbac.ts landing tidak ditemukan (%v)", err)
	}
	ts := petaTS(t, string(isi))
	if len(ts) == 0 {
		t.Fatal("ROLE_PERMISSIONS di utils/rbac.ts tidak terbaca")
	}
	for peran, izin := range RolePermissions {
		var goIzin []string
		for p, ok := range izin {
			if ok {
				goIzin = append(goIzin, string(p))
			}
		}
		sort.Strings(goIzin)
		tsIzin := ts[peran]
		sort.Strings(tsIzin)
		if strings.Join(goIzin, ",") != strings.Join(tsIzin, ",") {
			t.Errorf("peran %s beda:\n  go: %v\n  ts: %v", peran, goIzin, tsIzin)
		}
	}
	for peran := range ts {
		if _, ok := RolePermissions[peran]; !ok {
			t.Errorf("peran %s ada di utils/rbac.ts tapi tidak di permissions.go", peran)
		}
	}
}

func petaTS(t *testing.T, isi string) map[string][]string {
	t.Helper()
	awal := strings.Index(isi, "ROLE_PERMISSIONS")
	if awal < 0 {
		return nil
	}
	buka := strings.Index(isi[awal:], "= {")
	if buka < 0 {
		return nil
	}
	isi = isi[awal+buka+3:]
	// Objek ditutup "}" di awal baris.
	if tutup := strings.Index(isi, "\n}"); tutup >= 0 {
		isi = isi[:tutup]
	}
	peta := map[string][]string{}
	blok := regexp.MustCompile(`(?s)(\w+):\s*\[(.*?)\]`)
	teks := regexp.MustCompile(`'([^']+)'`)
	for _, m := range blok.FindAllStringSubmatch(isi, -1) {
		var izin []string
		for _, x := range teks.FindAllStringSubmatch(m[2], -1) {
			izin = append(izin, x[1])
		}
		peta[m[1]] = izin
	}
	return peta
}
