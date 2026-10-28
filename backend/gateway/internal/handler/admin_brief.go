package handler

import (
	"context"
	mw "github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/rbac"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"log/slog"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

type adminBriefStore interface {
	ListBriefs(context.Context, int, int, string) ([]model.AdminBrief, int, error)
	GetBrief(context.Context, string) (*model.AdminBrief, error)
}
type AdminBriefHandler struct{ repo adminBriefStore }

func NewAdminBriefHandler(repo adminBriefStore) *AdminBriefHandler {
	return &AdminBriefHandler{repo: repo}
}

func registerAdminBriefRoutes(admin fiber.Router, h *AdminBriefHandler, liveSession fiber.Handler) {
	admin.Get("/briefs", liveSession, mw.RequirePermission(rbac.BriefsList), h.List)
	admin.Get("/briefs/:id", liveSession, mw.RequirePermission(rbac.BriefsView), h.Get)
}

func (h *AdminBriefHandler) List(c fiber.Ctx) error {
	c.Set("Cache-Control", "no-store")
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 || page > 100000 {
		return errResponse(c, apperr.NewBadRequest("Halaman tidak valid"))
	}
	size, err := strconv.Atoi(c.Query("per_page", "25"))
	if err != nil || size < 1 || size > 100 {
		return errResponse(c, apperr.NewBadRequest("Ukuran halaman harus 1–100"))
	}
	search := strings.TrimSpace(c.Query("search"))
	if utf8.RuneCountInString(search) > 200 {
		return errResponse(c, apperr.NewBadRequest("Pencarian maksimal 200 karakter"))
	}
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()
	briefs, total, err := h.repo.ListBriefs(ctx, page, size, search)
	if err != nil {
		slog.Error("gagal membaca daftar brief", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	return paginated(c, briefs, total, page, size)
}

func (h *AdminBriefHandler) Get(c fiber.Ctx) error {
	c.Set("Cache-Control", "no-store")
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()
	brief, err := h.repo.GetBrief(ctx, id.String())
	if err != nil {
		slog.Error("gagal membaca brief", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}
	if brief == nil {
		return errResponse(c, apperr.NewNotFound("Brief"))
	}
	return ok(c, brief)
}
