package middleware

import (
	"net"
	"strings"

	"github.com/gofiber/fiber/v3"
)

// ClientIP adalah IP klien untuk kunci pembatas, log, dan audit auth admin.
//
// Sengaja TIDAK memakai c.IP(). Di produksi (ProxyHeader=X-Forwarded-For,
// TrustProxy, EnableIPValidation) Fiber v3 memulangkan entri XFF valid paling
// KIRI, dan entri itu dikirim klien sendiri: Cloudflare dan nginx-proxy hanya
// MENAMBAH entri di kanan. Dengan c.IP(), XFF acak per permintaan cukup untuk
// lolos dari pembatas per IP dan memalsukan ip_address di audit.
//
// Aturannya:
//  1. Header penerusan hanya dibaca bila peer TCP langsung adalah proxy internal
//     (loopback/privat, mis. nginx-proxy di jaringan docker). Klien yang
//     tersambung langsung memakai alamat TCP-nya, apa pun isi XFF.
//  2. XFF ditelusuri dari KANAN. Hop tepercaya (loopback/privat dan rentang IP
//     Cloudflare) dilewati; entri pertama yang bukan hop tepercaya adalah
//     klien. Entri di kirinya, yang bisa dikarang klien, tidak pernah dibaca.
//  3. Entri rusak menghentikan penelusuran; yang dipakai hop tepercaya terakhir
//     (kunci pembatas jadi lebih kasar, bukan lebih longgar).
//
// Contoh di balik Cloudflare + nginx-proxy, klien mengirim XFF "1.2.3.4":
// gateway menerima "1.2.3.4, <klien>, <edge Cloudflare>" dan ClientIP = <klien>.
// Tanpa Cloudflare (tersambung langsung ke origin): "1.2.3.4, <klien>" → <klien>.
//
// Batas yang tersisa: permintaan yang keluar dari rentang Cloudflare tanpa
// melalui proxy-nya (mis. Cloudflare Workers yang memanggil origin) masih bisa
// mengarang entri di kiri edge. Penutup tuntasnya ada di infrastruktur
// (origin hanya menerima Cloudflare / authenticated origin pulls).
func ClientIP(c fiber.Ctx) string {
	ip := clientIPFrom(c.RequestCtx().RemoteIP(), forwardedFor(c))
	if ip == nil {
		return ""
	}
	return ip.String()
}

// ClientIPKey adalah kunci pembatas per IP untuk ClientIP. IPv6 dikelompokkan
// per /64 (satu pelanggan lazimnya memegang seluruh /64), supaya berganti
// alamat di dalam prefiks sendiri tidak menghasilkan jatah baru dan entri peta
// pembatas baru.
func ClientIPKey(c fiber.Ctx) string {
	return ipLimitKey(clientIPFrom(c.RequestCtx().RemoteIP(), forwardedFor(c)))
}

func ipLimitKey(ip net.IP) string {
	if ip == nil {
		return ""
	}
	if v4 := ip.To4(); v4 != nil {
		return v4.String()
	}
	return ip.Mask(net.CIDRMask(64, 128)).String() + "/64"
}

// forwardedFor memulangkan semua entri X-Forwarded-For berurutan dari kiri ke
// kanan, lintas baris header (baris header berulang setara dengan satu baris
// yang digabung koma, RFC 9110 §5.3).
func forwardedFor(c fiber.Ctx) []string {
	var out []string
	for _, line := range c.Request().Header.PeekAll(fiber.HeaderXForwardedFor) {
		for _, part := range strings.Split(string(line), ",") {
			out = append(out, strings.TrimSpace(part))
		}
	}
	return out
}

func clientIPFrom(peer net.IP, xff []string) net.IP {
	if peer == nil {
		return nil
	}
	if !isInternalProxy(peer) {
		return peer
	}
	client := peer
	for i := len(xff) - 1; i >= 0; i-- {
		ip := parseForwardedIP(xff[i])
		if ip == nil {
			break
		}
		client = ip
		if !isTrustedHop(ip) {
			break
		}
	}
	return client
}

// parseForwardedIP menerima "1.2.3.4", "2001:db8::1", "1.2.3.4:5678", dan
// "[2001:db8::1]:5678".
func parseForwardedIP(s string) net.IP {
	s = strings.TrimSpace(s)
	if ip := net.ParseIP(s); ip != nil {
		return ip
	}
	if host, _, err := net.SplitHostPort(s); err == nil {
		return net.ParseIP(host)
	}
	return nil
}

// isInternalProxy: peer yang boleh menyetel X-Forwarded-For (proxy di mesin
// atau jaringan docker yang sama). Sama dengan TrustProxyConfig produksi di
// server.go (Private + Loopback).
func isInternalProxy(ip net.IP) bool {
	return ip.IsLoopback() || ip.IsPrivate()
}

func isTrustedHop(ip net.IP) bool {
	if isInternalProxy(ip) {
		return true
	}
	for _, n := range cloudflareNets {
		if n.Contains(ip) {
			return true
		}
	}
	return false
}

// cloudflareRanges: rentang IP proxy Cloudflare, dari
// https://www.cloudflare.com/ips-v4 dan https://www.cloudflare.com/ips-v6
// (dicek 18 Sep 2026). Bila Cloudflare menambah rentang dan daftar ini basi,
// akibatnya edge baru dianggap klien: kunci pembatas dan IP audit menjadi IP
// edge (lebih kasar), tidak pernah menjadi nilai karangan klien.
var cloudflareRanges = []string{
	"173.245.48.0/20",
	"103.21.244.0/22",
	"103.22.200.0/22",
	"103.31.4.0/22",
	"141.101.64.0/18",
	"108.162.192.0/18",
	"190.93.240.0/20",
	"188.114.96.0/20",
	"197.234.240.0/22",
	"198.41.128.0/17",
	"162.158.0.0/15",
	"104.16.0.0/13",
	"104.24.0.0/14",
	"172.64.0.0/13",
	"131.0.72.0/22",
	"2400:cb00::/32",
	"2606:4700::/32",
	"2803:f800::/32",
	"2405:b500::/32",
	"2405:8100::/32",
	"2a06:98c0::/29",
	"2c0f:f248::/32",
}

var cloudflareNets = func() []*net.IPNet {
	nets := make([]*net.IPNet, 0, len(cloudflareRanges))
	for _, cidr := range cloudflareRanges {
		_, n, err := net.ParseCIDR(cidr)
		if err != nil {
			panic("cloudflareRanges: " + cidr + ": " + err.Error())
		}
		nets = append(nets, n)
	}
	return nets
}()
