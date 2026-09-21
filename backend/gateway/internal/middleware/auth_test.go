package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/coreasia/gateway/internal/auth"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/rbac"
	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const mwTestSecret = "rahasia-uji-middleware"

func newMWTestApp(p *auth.JWTProvider) *fiber.App {
	app := fiber.New()
	app.Get("/api/admin/auth/me", AuthMiddleware(p), func(c fiber.Ctx) error {
		cl := GetClaims(c)
		if cl == nil {
			return c.SendStatus(http.StatusInternalServerError)
		}
		return c.SendString(cl.UserID.String())
	})
	return app
}

func status(t *testing.T, app *fiber.App, bearer, cookie string) int {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/api/admin/auth/me", nil)
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	if cookie != "" {
		req.AddCookie(&http.Cookie{Name: "auth_admin_token", Value: cookie})
	}
	resp, err := app.Test(req, fiber.TestConfig{Timeout: 5 * time.Second})
	if err != nil {
		t.Fatal(err)
	}
	return resp.StatusCode
}

func TestAuthMiddleware_HanyaAccessToken(t *testing.T) {
	p := auth.NewJWTProvider(mwTestSecret, time.Hour, 720*time.Hour, "coreasia-gateway")
	app := newMWTestApp(p)
	uid := uuid.New()

	pair, err := p.GenerateTokenPair(uid, "uji@coreasia.id", "admin", "Uji", false, 0)
	if err != nil {
		t.Fatal(err)
	}
	challenge, _, _ := p.GenerateMFAChallenge(uid, "uji@coreasia.id", 0)

	// Token lama tanpa typ, ditandatangani secret yang sama.
	legacy, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, auth.Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "coreasia-gateway",
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
		UserID: uid, Role: "super_admin",
	}).SignedString([]byte(mwTestSecret))

	cases := []struct {
		name           string
		bearer, cookie string
		want           int
	}{
		{"access sebagai Bearer", pair.AccessToken, "", http.StatusOK},
		{"access lewat cookie", "", pair.AccessToken, http.StatusOK},
		{"refresh sebagai Bearer", pair.RefreshToken, "", http.StatusUnauthorized},
		{"refresh lewat cookie", "", pair.RefreshToken, http.StatusUnauthorized},
		{"tantangan MFA", challenge, "", http.StatusUnauthorized},
		{"token lama tanpa typ", legacy, "", http.StatusUnauthorized},
		{"tanpa token", "", "", http.StatusUnauthorized},
		{"sampah", "abc.def.ghi", "", http.StatusUnauthorized},
	}
	for _, tc := range cases {
		if got := status(t, app, tc.bearer, tc.cookie); got != tc.want {
			t.Errorf("%s: status = %d, want %d", tc.name, got, tc.want)
		}
	}
}

type finderFunc func(ctx context.Context, id uuid.UUID) (*model.AdminUser, error)

func (f finderFunc) FindByID(ctx context.Context, id uuid.UUID) (*model.AdminUser, error) {
	return f(ctx, id)
}

func TestRequireLiveSession(t *testing.T) {
	p := auth.NewJWTProvider(mwTestSecret, time.Hour, 720*time.Hour, "coreasia-gateway")
	uid := uuid.New()
	pair, err := p.GenerateTokenPair(uid, "uji@coreasia.id", "super_admin", "Uji", true, 3)
	if err != nil {
		t.Fatal(err)
	}
	var (
		row   *model.AdminUser
		dbErr error
	)
	finder := finderFunc(func(_ context.Context, id uuid.UUID) (*model.AdminUser, error) {
		if dbErr != nil || row == nil || id != row.ID {
			return nil, dbErr
		}
		cp := *row
		return &cp, nil
	})
	app := fiber.New()
	app.Post("/api/admin/users", AuthMiddleware(p), RequireLiveSession(finder), RequirePermission(rbac.UsersCreate), func(c fiber.Ctx) error {
		return c.SendString(GetClaims(c).Role)
	})
	app.Post("/tanpa-auth", RequireLiveSession(finder), func(c fiber.Ctx) error { return c.SendStatus(http.StatusOK) })
	call := func(path string) int {
		t.Helper()
		req := httptest.NewRequest(http.MethodPost, path, nil)
		req.Header.Set("Authorization", "Bearer "+pair.AccessToken)
		resp, err := app.Test(req, fiber.TestConfig{Timeout: 5 * time.Second})
		if err != nil {
			t.Fatal(err)
		}
		return resp.StatusCode
	}

	row = &model.AdminUser{ID: uid, Role: "super_admin", IsActive: true, TokenVersion: 3}
	if got := call("/api/admin/users"); got != http.StatusOK {
		t.Fatalf("sesi hidup: %d", got)
	}
	cases := []struct {
		name string
		set  func()
		want int
	}{
		{"tv naik", func() { row.TokenVersion = 4 }, http.StatusUnauthorized},
		{"nonaktif", func() { row.IsActive = false }, http.StatusUnauthorized},
		{"akun hilang", func() { row = nil }, http.StatusUnauthorized},
		{"peran di DB turun", func() { row.Role = "admin" }, http.StatusForbidden},
		{"DB galat", func() { dbErr = errors.New("db mati") }, http.StatusInternalServerError},
	}
	for _, tc := range cases {
		row = &model.AdminUser{ID: uid, Role: "super_admin", IsActive: true, TokenVersion: 3}
		dbErr = nil
		tc.set()
		if got := call("/api/admin/users"); got != tc.want {
			t.Errorf("%s: status = %d, want %d", tc.name, got, tc.want)
		}
	}
	row, dbErr = &model.AdminUser{ID: uid, Role: "super_admin", IsActive: true, TokenVersion: 3}, nil
	if got := call("/tanpa-auth"); got != http.StatusUnauthorized {
		t.Fatalf("tanpa AuthMiddleware (tanpa klaim): %d, want 401", got)
	}
}
