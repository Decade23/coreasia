// Package auditip membawa IP klien yang DILAPORKAN BFF console landing
// (header X-Konsol-Klien-IP) dari middleware ke pencatat audit lewat context.
//
// Sejak Fase 0c, aksi console yang lewat proxy BFF Nitro (/api/gw/**) datang
// dari IP keluar Vercel, jadi ip_address di gateway_audit_logs hanya memuat IP
// Vercel. BFF meneruskan IP peramban admin di header ini. Nilainya TIDAK
// tepercaya: siapa pun yang memanggil gateway langsung bisa mengarangnya.
// Karena itu hanya dicatat di kolom terpisah (reported_client_ip), tidak pernah
// dipakai untuk pembatas, kunci percobaan, atau keputusan keamanan apa pun.
// IP yang dipakai untuk semua itu tetap middleware.ClientIP.
package auditip

import (
	"context"
	"net"
	"strings"
)

// Header dikirim BFF console (landing server/lib/konsol/proxy.ts).
const Header = "X-Konsol-Klien-IP"

type ctxKey struct{}

// Parse memulangkan satu IP yang sah dalam bentuk kanonik (IPv4-mapped IPv6
// menjadi IPv4), atau "" untuk nilai kosong, daftar, port, atau sampah.
// Panjang dibatasi kolom VARCHAR(45).
func Parse(v string) string {
	v = strings.TrimSpace(v)
	if v == "" || len(v) > 45 {
		return ""
	}
	ip := net.ParseIP(v)
	if ip == nil {
		return ""
	}
	return ip.String()
}

// With menitipkan IP yang dilaporkan ke context. Nilai tidak sah diabaikan.
func With(ctx context.Context, ip string) context.Context {
	if ip = Parse(ip); ip == "" {
		return ctx
	}
	return context.WithValue(ctx, ctxKey{}, ip)
}

// From memulangkan IP yang dilaporkan, atau "" bila tidak ada.
func From(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	ip, _ := ctx.Value(ctxKey{}).(string)
	return ip
}
