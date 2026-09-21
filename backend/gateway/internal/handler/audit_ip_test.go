package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auditip"
	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/gofiber/fiber/v3"
)

// doIP: seperti e.do, dengan header X-Konsol-Klien-IP (nilai kiriman BFF, atau
// karangan pemanggil langsung).
func (e *authEnv) doIP(t *testing.T, method, path, bearer, reportedIP string, body any) int {
	t.Helper()
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(method, path, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	if reportedIP != "" {
		req.Header.Set(auditip.Header, reportedIP)
	}
	resp, err := e.app.Test(req, fiber.TestConfig{Timeout: 5 * time.Second})
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	return resp.StatusCode
}

// Aksi lewat proxy BFF: ip_address = IP yang dilihat gateway (mw.ClientIP),
// reported_client_ip = IP yang dilaporkan BFF. Keduanya tidak tertukar.
func TestAudit_IPDilaporkanBFF_KolomTerpisah(t *testing.T) {
	e := newAuthEnv(t)
	boss := e.addAdmin(t, "boss@coreasia.id", "super_admin")
	target := e.addAdmin(t, "target@coreasia.id", "admin")
	tok := e.tokens(t, boss, false).AccessToken

	path := "/api/admin/users/" + target.ID.String() + "/revoke-sessions"
	if st := e.doIP(t, http.MethodPost, path, tok, "203.0.113.50", nil); st != http.StatusOK {
		t.Fatalf("revoke-sessions: %d", st)
	}
	ip, reported, ok := e.audit.lastOf("revoke_sessions")
	if !ok {
		t.Fatal("revoke_sessions tidak diaudit")
	}
	if reported != "203.0.113.50" {
		t.Fatalf("reported = %q, want 203.0.113.50", reported)
	}
	if ip == reported || ip == "" {
		t.Fatalf("ip_address harus IP yang dilihat gateway, bukan header: %q", ip)
	}

	// Tanpa header (login langsung dari peramban, atau pemanggil lain): kosong.
	if st := e.doIP(t, http.MethodPost, path, tok, "", nil); st != http.StatusOK {
		t.Fatalf("revoke-sessions tanpa header: %d", st)
	}
	if _, reported, _ := e.audit.lastOf("revoke_sessions"); reported != "" {
		t.Fatalf("tanpa header reported harus kosong, dapat %q", reported)
	}

	// Nilai sampah tidak dicatat.
	if st := e.doIP(t, http.MethodPost, path, tok, "1.2.3.4, 5.6.7.8", nil); st != http.StatusOK {
		t.Fatalf("revoke-sessions header daftar: %d", st)
	}
	if _, reported, _ := e.audit.lastOf("revoke_sessions"); reported != "" {
		t.Fatalf("daftar IP tidak boleh dicatat, dapat %q", reported)
	}
}

// Header yang dilaporkan TIDAK tepercaya: mengarangnya berbeda-beda di setiap
// percobaan tidak memberi jatah baru di pembatas /login per IP, dan tidak
// menggantikan ip_address audit login.
func TestAudit_IPDilaporkan_TidakMelonggarkanPembatasLogin(t *testing.T) {
	limiter := mw.NewIPRateLimiter(5, 15*time.Minute, false)
	e := newAuthEnvWith(t, envOpts{loginLimit: limiter.MiddlewareBy(mw.ClientIPKey)})
	e.addAdmin(t, "admin@coreasia.id", "admin")

	body := map[string]string{"email": "admin@coreasia.id", "password": authTestPassword}
	for i := 0; i < 5; i++ {
		if st := e.doIP(t, http.MethodPost, "/api/admin/auth/login", "", "198.51.100."+string(rune('1'+i)), body); st != http.StatusOK {
			t.Fatalf("login ke-%d: %d", i+1, st)
		}
	}
	ip, reported, ok := e.audit.lastOf("login")
	if !ok || reported != "198.51.100.5" || ip == reported {
		t.Fatalf("audit login: ip=%q reported=%q ok=%v", ip, reported, ok)
	}
	if st := e.doIP(t, http.MethodPost, "/api/admin/auth/login", "", "192.0.2.77", body); st != http.StatusTooManyRequests {
		t.Fatalf("login ke-6 dengan IP dilaporkan baru: %d, want 429 (header tidak boleh jadi kunci pembatas)", st)
	}
}
