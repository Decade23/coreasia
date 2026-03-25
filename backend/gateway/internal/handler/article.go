package handler

import (
	"log/slog"
	"strconv"
	"time"

	"github.com/coreasia/gateway/internal/middleware"
	"github.com/coreasia/gateway/internal/model"
	"github.com/coreasia/gateway/internal/repository"
	"github.com/coreasia/gateway/pkg/apperr"
	"github.com/coreasia/gateway/pkg/validate"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ArticleHandler struct {
	articleRepo *repository.ArticleRepo
	auditLog    *repository.AuditLogRepo
}

func NewArticleHandler(articleRepo *repository.ArticleRepo, auditLog *repository.AuditLogRepo) *ArticleHandler {
	return &ArticleHandler{articleRepo: articleRepo, auditLog: auditLog}
}

// ListPublished returns published articles (public endpoint)
func (h *ArticleHandler) ListPublished(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	category := c.Query("category")
	search := c.Query("search")

	articles, total, err := h.articleRepo.FindPublished(c.Context(), page, perPage, category, search)
	if err != nil {
		slog.Error("gagal list artikel publik", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	return paginated(c, articles, total, page, perPage)
}

// GetBySlug returns a single published article (public endpoint)
func (h *ArticleHandler) GetBySlug(c fiber.Ctx) error {
	slug := c.Params("slug")
	article, err := h.articleRepo.FindBySlug(c.Context(), slug)
	if err != nil {
		slog.Error("gagal cari artikel", "error", err, "slug", slug)
		return errResponse(c, apperr.NewInternal(err))
	}
	if article == nil {
		return errResponse(c, apperr.NewNotFound("Artikel"))
	}
	return ok(c, article)
}

// ListAll returns all articles for admin
func (h *ArticleHandler) ListAll(c fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))

	filter := model.ArticleListFilter{
		Page:     page,
		PerPage:  perPage,
		Status:   c.Query("status"),
		Category: c.Query("category"),
		Search:   c.Query("search"),
	}

	articles, total, err := h.articleRepo.FindAll(c.Context(), filter)
	if err != nil {
		slog.Error("gagal list artikel admin", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	return paginated(c, articles, total, page, perPage)
}

// GetByID returns an article by ID (admin)
func (h *ArticleHandler) GetByID(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	article, err := h.articleRepo.FindByID(c.Context(), id)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if article == nil {
		return errResponse(c, apperr.NewNotFound("Artikel"))
	}

	return ok(c, article)
}

// Create creates a new article
func (h *ArticleHandler) Create(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var req model.CreateArticleRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	if req.Author == "" {
		req.Author = "Tim CoreAsia"
	}
	if req.ReadTime == 0 {
		req.ReadTime = 5
	}
	if req.Status == "" {
		req.Status = "draft"
	}

	// Non-super_admin tidak boleh langsung publish saat create
	if req.Status == "published" && claims.Role != "super_admin" {
		req.Status = "draft"
	}

	var publishedAt *time.Time
	if req.Status == "published" {
		now := time.Now()
		publishedAt = &now
	}

	article := &model.Article{
		Slug:           req.Slug,
		Title:          req.Title,
		Description:    req.Description,
		Content:        req.Content,
		Category:       req.Category,
		Tags:           req.Tags,
		Author:         req.Author,
		ReadTime:       req.ReadTime,
		Status:         req.Status,
		FeaturedImage:  req.FeaturedImage,
		SEOTitle:       req.SEOTitle,
		SEODescription: req.SEODescription,
		PublishedAt:    publishedAt,
		CreatedBy:      &claims.UserID,
		UpdatedBy:      &claims.UserID,
	}

	if err := h.articleRepo.Create(c.Context(), article); err != nil {
		slog.Error("gagal buat artikel", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := article.ID.String()
	desc := "Membuat artikel: " + article.Title
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "create", "articles", &resID, &desc, c.IP())

	return created(c, article)
}

// Update updates an article
func (h *ArticleHandler) Update(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	article, err := h.articleRepo.FindByID(c.Context(), id)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if article == nil {
		return errResponse(c, apperr.NewNotFound("Artikel"))
	}

	var req model.UpdateArticleRequest
	if err := c.Bind().JSON(&req); err != nil {
		return errResponse(c, apperr.NewBadRequest("Format request tidak valid"))
	}
	if appErr := validate.Struct(&req); appErr != nil {
		return errResponse(c, appErr)
	}

	if req.Title != nil {
		article.Title = *req.Title
	}
	if req.Slug != nil {
		article.Slug = *req.Slug
	}
	if req.Description != nil {
		article.Description = *req.Description
	}
	if req.Content != nil {
		article.Content = *req.Content
	}
	if req.Category != nil {
		article.Category = *req.Category
	}
	if req.Tags != nil {
		article.Tags = req.Tags
	}
	if req.Author != nil {
		article.Author = *req.Author
	}
	if req.ReadTime != nil {
		article.ReadTime = *req.ReadTime
	}
	if req.FeaturedImage != nil {
		article.FeaturedImage = req.FeaturedImage
	}
	if req.SEOTitle != nil {
		article.SEOTitle = req.SEOTitle
	}
	if req.SEODescription != nil {
		article.SEODescription = req.SEODescription
	}
	article.UpdatedBy = &claims.UserID

	if err := h.articleRepo.Update(c.Context(), article); err != nil {
		slog.Error("gagal update artikel", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := article.ID.String()
	desc := "Mengupdate artikel: " + article.Title
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "update", "articles", &resID, &desc, c.IP())

	return ok(c, article)
}

// Delete deletes an article
func (h *ArticleHandler) Delete(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims.Role != "super_admin" {
		return errResponse(c, apperr.NewForbidden("Hanya super admin yang dapat menghapus artikel"))
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	article, err := h.articleRepo.FindByID(c.Context(), id)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if article == nil {
		return errResponse(c, apperr.NewNotFound("Artikel"))
	}

	if err := h.articleRepo.Delete(c.Context(), id); err != nil {
		slog.Error("gagal hapus artikel", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := id.String()
	desc := "Menghapus artikel: " + article.Title
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "delete", "articles", &resID, &desc, c.IP())

	return c.Status(fiber.StatusNoContent).Send(nil)
}

// Publish publishes an article
func (h *ArticleHandler) Publish(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims.Role != "super_admin" {
		return errResponse(c, apperr.NewForbidden("Hanya super admin yang dapat mempublish artikel"))
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	article, err := h.articleRepo.FindByID(c.Context(), id)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if article == nil {
		return errResponse(c, apperr.NewNotFound("Artikel"))
	}

	if err := h.articleRepo.SetStatus(c.Context(), id, "published", claims.UserID); err != nil {
		slog.Error("gagal publish artikel", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := id.String()
	desc := "Mempublish artikel: " + article.Title
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "publish", "articles", &resID, &desc, c.IP())

	updatedArticle, _ := h.articleRepo.FindByID(c.Context(), id)
	return ok(c, updatedArticle)
}

// Unpublish sets an article back to draft
func (h *ArticleHandler) Unpublish(c fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims.Role != "super_admin" {
		return errResponse(c, apperr.NewForbidden("Hanya super admin yang dapat meng-unpublish artikel"))
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return errResponse(c, apperr.NewBadRequest("ID tidak valid"))
	}

	article, err := h.articleRepo.FindByID(c.Context(), id)
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	if article == nil {
		return errResponse(c, apperr.NewNotFound("Artikel"))
	}

	if err := h.articleRepo.SetStatus(c.Context(), id, "draft", claims.UserID); err != nil {
		slog.Error("gagal unpublish artikel", "error", err)
		return errResponse(c, apperr.NewInternal(err))
	}

	resID := id.String()
	desc := "Meng-unpublish artikel: " + article.Title
	h.auditLog.LogAction(c.Context(), &claims.UserID, &claims.FullName, "unpublish", "articles", &resID, &desc, c.IP())

	updatedArticle, _ := h.articleRepo.FindByID(c.Context(), id)
	return ok(c, updatedArticle)
}

// Stats returns article counts by status (for dashboard)
func (h *ArticleHandler) Stats(c fiber.Ctx) error {
	counts, err := h.articleRepo.CountByStatus(c.Context())
	if err != nil {
		return errResponse(c, apperr.NewInternal(err))
	}
	return ok(c, counts)
}
