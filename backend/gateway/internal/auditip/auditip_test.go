package auditip

import (
	"context"
	"testing"
)

func TestParse(t *testing.T) {
	cases := map[string]string{
		"203.0.113.7":          "203.0.113.7",
		"  203.0.113.7 ":       "203.0.113.7",
		"2001:db8::1":          "2001:db8::1",
		"2001:DB8:0:0::1":      "2001:db8::1",
		"::ffff:203.0.113.7":   "203.0.113.7",
		"":                     "",
		"bukan-ip":             "",
		"203.0.113.7, 1.2.3.4": "",
		"203.0.113.7:443":      "",
		"[2001:db8::1]":        "",
		"1.2.3.4' OR '1'='1":   "",
	}
	for in, want := range cases {
		if got := Parse(in); got != want {
			t.Errorf("Parse(%q) = %q, want %q", in, got, want)
		}
	}
	long := "2001:0db8:0000:0000:0000:ff00:0042:8329:ffff:ffff"
	if got := Parse(long); got != "" {
		t.Errorf("Parse(panjang) = %q, want kosong", got)
	}
}

func TestWithFrom(t *testing.T) {
	ctx := context.Background()
	if got := From(ctx); got != "" {
		t.Fatalf("From tanpa nilai = %q", got)
	}
	if got := From(With(ctx, "sampah")); got != "" {
		t.Fatalf("nilai tidak sah ikut tercatat: %q", got)
	}
	if got := From(With(ctx, "::ffff:198.51.100.2")); got != "198.51.100.2" {
		t.Fatalf("From = %q", got)
	}
	var tanpa context.Context
	if got := From(tanpa); got != "" {
		t.Fatalf("From(nil) = %q", got)
	}
}
