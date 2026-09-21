package middleware

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
)

func TestClientIPFrom(t *testing.T) {
	nginx := net.ParseIP("172.18.0.5") // nginx-proxy di jaringan docker
	for _, tc := range []struct {
		name string
		peer net.IP
		xff  string
		want string
	}{
		{"tanpa XFF", nginx, "", "172.18.0.5"},
		{"lewat Cloudflare, klien tidak mengarang", nginx, "203.0.113.7, 162.158.1.1", "203.0.113.7"},
		{"lewat Cloudflare, klien mengarang satu entri", nginx, "9.9.9.9, 203.0.113.7, 162.158.1.1", "203.0.113.7"},
		{"lewat Cloudflare, klien mengarang IP privat", nginx, "10.0.0.1, 203.0.113.7, 172.70.1.1", "203.0.113.7"},
		{"lewat Cloudflare, klien mengarang IP Cloudflare", nginx, "104.16.0.1, 203.0.113.7, 108.162.200.1", "203.0.113.7"},
		{"langsung ke origin, klien mengarang", nginx, "1.2.3.4, 198.51.100.9", "198.51.100.9"},
		{"klien IPv6 lewat Cloudflare", nginx, "1.2.3.4, 2001:db8:1:2::abcd, 2606:4700::1", "2001:db8:1:2::abcd"},
		{"entri berport", nginx, "1.2.3.4, 203.0.113.7:5555, 162.158.1.1", "203.0.113.7"},
		{"entri rusak di kanan: pakai hop tepercaya terakhir", nginx, "1.2.3.4, bukan-ip, 162.158.1.1", "162.158.1.1"},
		{"entri rusak paling kanan: pakai peer", nginx, "1.2.3.4, bukan-ip", "172.18.0.5"},
		{"semua hop tepercaya", nginx, "10.1.1.1, 162.158.1.1", "10.1.1.1"},
		{"peer publik: XFF diabaikan", net.ParseIP("198.51.100.9"), "1.2.3.4", "198.51.100.9"},
		{"peer loopback", net.ParseIP("127.0.0.1"), "1.2.3.4, 203.0.113.7", "203.0.113.7"},
	} {
		var xff []string
		if tc.xff != "" {
			for _, p := range strings.Split(tc.xff, ",") {
				xff = append(xff, strings.TrimSpace(p))
			}
		}
		if got := clientIPFrom(tc.peer, xff).String(); got != tc.want {
			t.Errorf("%s: ClientIP = %s, want %s", tc.name, got, tc.want)
		}
	}
	if clientIPFrom(nil, []string{"1.2.3.4"}) != nil {
		t.Error("peer nil harus memulangkan nil")
	}
}

func TestIPLimitKey(t *testing.T) {
	for in, want := range map[string]string{
		"203.0.113.7":           "203.0.113.7",
		"::ffff:203.0.113.7":    "203.0.113.7",
		"2001:db8:1:2::abcd":    "2001:db8:1:2::/64",
		"2001:db8:1:2:ffff::1":  "2001:db8:1:2::/64",
		"2001:db8:1:3::1":       "2001:db8:1:3::/64",
		"2606:4700:10::6816:1a": "2606:4700:10::/64",
	} {
		if got := ipLimitKey(net.ParseIP(in)); got != want {
			t.Errorf("ipLimitKey(%s) = %s, want %s", in, got, want)
		}
	}
	if ipLimitKey(nil) != "" {
		t.Error("nil → kunci kosong")
	}
}

// prodApp: konfigurasi proxy produksi persis (server.go), mendengar di
// 127.0.0.1 supaya peer = loopback, sama seperti nginx-proxy yang tepercaya.
func prodApp(t *testing.T) (*fiber.App, net.Listener, string) {
	t.Helper()
	app := fiber.New(fiber.Config{
		ProxyHeader:        fiber.HeaderXForwardedFor,
		TrustProxy:         true,
		EnableIPValidation: true,
		TrustProxyConfig:   fiber.TrustProxyConfig{Private: true, Loopback: true},
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = app.Shutdown() })
	return app, ln, "http://" + ln.Addr().String()
}

// serve menjalankan app di ln (setelah rute didaftarkan) dan menunggu siap.
func serve(t *testing.T, app *fiber.App, ln net.Listener) {
	t.Helper()
	go func() { _ = app.Listener(ln, fiber.ListenConfig{DisableStartupMessage: true}) }()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if c, err := net.Dial("tcp", ln.Addr().String()); err == nil {
			c.Close()
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("server uji tidak siap")
}

func send(t *testing.T, method, url, xff string) (int, string) {
	t.Helper()
	req, _ := http.NewRequest(method, url, nil)
	if xff != "" {
		req.Header.Set("X-Forwarded-For", xff)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, string(b)
}

// Temuan putaran 2: dengan konfigurasi produksi, c.IP() = entri XFF paling
// kiri (karangan klien). ClientIP tidak terpengaruh entri itu.
func TestClientIP_KonfigurasiProduksi(t *testing.T) {
	app, ln, base := prodApp(t)
	app.Get("/ip", func(c fiber.Ctx) error { return c.SendString(c.IP() + "|" + ClientIP(c)) })
	serve(t, app, ln)

	_, body := send(t, http.MethodGet, base+"/ip", "9.9.9.9, 203.0.113.7, 162.158.1.1")
	if body != "9.9.9.9|203.0.113.7" {
		t.Fatalf("c.IP()|ClientIP = %s, want 9.9.9.9|203.0.113.7", body)
	}
}

// Pembatas per IP yang dikunci ClientIPKey tidak bisa dielak dengan XFF acak
// per permintaan, dan entri acak itu tidak menambah isi peta pembatas.
func TestIPRateLimiter_XFFAcakTidakMenambahJatah(t *testing.T) {
	app, ln, base := prodApp(t)
	rl := NewIPRateLimiter(5, 15*time.Minute, false)
	app.Post("/login", rl.MiddlewareBy(ClientIPKey), func(c fiber.Ctx) error { return c.SendStatus(http.StatusUnauthorized) })
	serve(t, app, ln)

	for i := 1; i <= 12; i++ {
		code, _ := send(t, http.MethodPost, base+"/login", fmt.Sprintf("10.%d.%d.%d, 203.0.113.7, 162.158.1.1", i, i, i))
		want := http.StatusUnauthorized
		if i > 5 {
			want = http.StatusTooManyRequests
		}
		if code != want {
			t.Fatalf("permintaan ke-%d: %d, want %d", i, code, want)
		}
	}
	rl.mu.Lock()
	n := len(rl.entries)
	rl.mu.Unlock()
	if n != 1 {
		t.Fatalf("peta pembatas berisi %d kunci, want 1", n)
	}
	// Klien lain (IP asli berbeda) punya jatah sendiri.
	if code, _ := send(t, http.MethodPost, base+"/login", "203.0.113.8, 162.158.1.1"); code != http.StatusUnauthorized {
		t.Fatalf("klien lain: %d, want 401 (jatah sendiri)", code)
	}
}

// Rute lain tetap memakai Middleware() (kunci c.IP()) tanpa perubahan.
func TestIPRateLimiter_MiddlewareLamaTetapCIP(t *testing.T) {
	app := fiber.New()
	rl := NewIPRateLimiter(1, time.Minute, false)
	app.Get("/x", rl.Middleware(), func(c fiber.Ctx) error { return c.SendStatus(http.StatusOK) })
	for i, want := range []int{http.StatusOK, http.StatusTooManyRequests} {
		resp, err := app.Test(httptest.NewRequest(http.MethodGet, "/x", nil))
		if err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != want {
			t.Fatalf("permintaan ke-%d: %d, want %d", i+1, resp.StatusCode, want)
		}
	}
}
