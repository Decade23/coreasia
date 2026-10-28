package handler

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/coreasia/gateway/internal/auth"
	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"net/http/httptest"
	"testing"
	"time"
)

type briefStoreFake struct {
	calls, page, size int
	search            string
	missing, broken   bool
}

func (s *briefStoreFake) ListBriefs(_ context.Context, p, n int, q string) ([]model.AdminBrief, int, error) {
	s.calls++
	s.page = p
	s.size = n
	s.search = q
	if s.broken {
		return nil, 0, errors.New("database unavailable")
	}
	return []model.AdminBrief{{Reference: "CA-EXAMPLE"}}, 1, nil
}
func (s *briefStoreFake) GetBrief(_ context.Context, id string) (*model.AdminBrief, error) {
	s.calls++
	if s.broken {
		return nil, errors.New("database unavailable")
	}
	if s.missing {
		return nil, nil
	}
	return &model.AdminBrief{ID: id, Reference: "CA-EXAMPLE", Message: "Isi brief"}, nil
}

type briefUsersFake struct{ user *model.AdminUser }

func (s briefUsersFake) FindByID(context.Context, uuid.UUID) (*model.AdminUser, error) {
	return s.user, nil
}

func TestAdminBriefAuthorizationAndValidation(t *testing.T) {
	id := uuid.New()
	for _, tt := range []struct {
		name, role, liveRole, path string
		active                     bool
		tv                         int
		want                       int
	}{
		{"anonymous", "", "admin", "/briefs", true, 1, 401},
		{"unknown role", "viewer", "viewer", "/briefs", true, 1, 403},
		{"role changed", "super_admin", "viewer", "/briefs/" + id.String(), true, 1, 403},
		{"revoked", "admin", "admin", "/briefs", true, 2, 401},
		{"inactive", "admin", "admin", "/briefs", false, 1, 401},
		{"admin list", "admin", "admin", "/briefs?page=2&per_page=10&search=%20contoh%20", true, 1, 200},
		{"super admin detail", "super_admin", "super_admin", "/briefs/" + id.String(), true, 1, 200},
		{"page lower bound", "admin", "admin", "/briefs?page=0", true, 1, 400},
		{"page upper bound", "admin", "admin", "/briefs?page=99999999", true, 1, 400},
		{"size upper bound", "admin", "admin", "/briefs?per_page=101", true, 1, 400},
		{"bad id", "admin", "admin", "/briefs/not-a-uuid", true, 1, 400},
	} {
		t.Run(tt.name, func(t *testing.T) {
			store := &briefStoreFake{}
			provider := auth.NewJWTProvider("local-test-only-brief-secret-long-enough", time.Hour, time.Hour, "brief-tests")
			app := fiber.New()
			admin := app.Group("/api/admin", mw.AuthMiddleware(provider))
			user := &model.AdminUser{ID: id, Role: tt.liveRole, IsActive: tt.active, TokenVersion: tt.tv}
			registerAdminBriefRoutes(admin, NewAdminBriefHandler(store), mw.RequireLiveSession(briefUsersFake{user}))
			req := httptest.NewRequest("GET", "/api/admin"+tt.path, nil)
			if tt.role != "" {
				pair, err := provider.GenerateTokenPair(id, "admin@example.test", tt.role, "Admin", false, 1)
				if err != nil {
					t.Fatal(err)
				}
				req.Header.Set("Authorization", "Bearer "+pair.AccessToken)
			}
			res, err := app.Test(req)
			if err != nil {
				t.Fatal(err)
			}
			defer res.Body.Close()
			if res.StatusCode != tt.want {
				t.Fatalf("status %d want %d", res.StatusCode, tt.want)
			}
			if tt.want != 200 && store.calls != 0 {
				t.Fatal("unauthorized/invalid request reached repository")
			}
			if tt.want == 200 && res.Header.Get("Cache-Control") != "no-store" {
				t.Fatal("PII response can be cached")
			}
			if tt.name == "admin list" && (store.page != 2 || store.size != 10 || store.search != "contoh") {
				t.Fatal("pagination/search lost")
			}
		})
	}
}

func TestAdminBriefMissingAndStorageFailure(t *testing.T) {
	for _, tt := range []struct {
		missing, broken bool
		path            string
		want            int
	}{
		{true, false, "/" + uuid.NewString(), 404}, {false, true, "", 500}, {false, true, "/" + uuid.NewString(), 500},
	} {
		app := fiber.New()
		store := &briefStoreFake{missing: tt.missing, broken: tt.broken}
		h := NewAdminBriefHandler(store)
		app.Get("/briefs", h.List)
		app.Get("/briefs/:id", h.Get)
		res, err := app.Test(httptest.NewRequest("GET", "/briefs"+tt.path, nil))
		if err != nil {
			t.Fatal(err)
		}
		var body map[string]any
		json.NewDecoder(res.Body).Decode(&body)
		res.Body.Close()
		if res.StatusCode != tt.want || body["data"] != nil {
			t.Fatalf("status=%d data=%v", res.StatusCode, body["data"])
		}
	}
}
