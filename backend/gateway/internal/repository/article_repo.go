package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ArticleRepo struct {
	pool *pgxpool.Pool
}

func NewArticleRepo(pool *pgxpool.Pool) *ArticleRepo {
	return &ArticleRepo{pool: pool}
}

const articleColumns = `id, slug, title, description, content, category, tags, author,
	read_time, status, featured_image, seo_title, seo_description,
	published_at, created_by, updated_by, created_at, updated_at`

func scanArticle(row pgx.Row) (*model.Article, error) {
	var a model.Article
	err := row.Scan(
		&a.ID, &a.Slug, &a.Title, &a.Description, &a.Content, &a.Category,
		&a.Tags, &a.Author, &a.ReadTime, &a.Status, &a.FeaturedImage,
		&a.SEOTitle, &a.SEODescription, &a.PublishedAt,
		&a.CreatedBy, &a.UpdatedBy, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func scanArticles(rows pgx.Rows) ([]model.Article, error) {
	var articles []model.Article
	for rows.Next() {
		var a model.Article
		if err := rows.Scan(
			&a.ID, &a.Slug, &a.Title, &a.Description, &a.Content, &a.Category,
			&a.Tags, &a.Author, &a.ReadTime, &a.Status, &a.FeaturedImage,
			&a.SEOTitle, &a.SEODescription, &a.PublishedAt,
			&a.CreatedBy, &a.UpdatedBy, &a.CreatedAt, &a.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scanning article: %w", err)
		}
		articles = append(articles, a)
	}
	return articles, rows.Err()
}

func (r *ArticleRepo) FindAll(ctx context.Context, filter model.ArticleListFilter) ([]model.Article, int, error) {
	offset := (filter.Page - 1) * filter.PerPage
	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if filter.Status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.Category != "" {
		where = append(where, fmt.Sprintf("category = $%d", argIdx))
		args = append(args, filter.Category)
		argIdx++
	}
	if filter.Search != "" {
		where = append(where, fmt.Sprintf("(title ILIKE $%d OR description ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM public.articles WHERE %s", whereClause)
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting articles: %w", err)
	}

	query := fmt.Sprintf(`SELECT %s FROM public.articles WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		articleColumns, whereClause, argIdx, argIdx+1)
	args = append(args, filter.PerPage, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("listing articles: %w", err)
	}
	defer rows.Close()

	articles, err := scanArticles(rows)
	return articles, total, err
}

func (r *ArticleRepo) FindPublished(ctx context.Context, page, perPage int, category, search string) ([]model.Article, int, error) {
	return r.FindAll(ctx, model.ArticleListFilter{
		Page:     page,
		PerPage:  perPage,
		Status:   "published",
		Category: category,
		Search:   search,
	})
}

func (r *ArticleRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Article, error) {
	query := fmt.Sprintf("SELECT %s FROM public.articles WHERE id = $1", articleColumns)
	a, err := scanArticle(r.pool.QueryRow(ctx, query, id))
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("finding article by id: %w", err)
	}
	return a, nil
}

func (r *ArticleRepo) FindBySlug(ctx context.Context, slug string) (*model.Article, error) {
	query := fmt.Sprintf("SELECT %s FROM public.articles WHERE slug = $1 AND status = 'published'", articleColumns)
	a, err := scanArticle(r.pool.QueryRow(ctx, query, slug))
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("finding article by slug: %w", err)
	}
	return a, nil
}

func (r *ArticleRepo) Create(ctx context.Context, a *model.Article) error {
	query := `
		INSERT INTO public.articles (slug, title, description, content, category, tags, author,
			read_time, status, featured_image, seo_title, seo_description, published_at, created_by, updated_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		RETURNING id, created_at, updated_at
	`
	return r.pool.QueryRow(ctx, query,
		a.Slug, a.Title, a.Description, a.Content, a.Category, a.Tags, a.Author,
		a.ReadTime, a.Status, a.FeaturedImage, a.SEOTitle, a.SEODescription,
		a.PublishedAt, a.CreatedBy, a.UpdatedBy,
	).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)
}

func (r *ArticleRepo) Update(ctx context.Context, a *model.Article) error {
	query := `
		UPDATE public.articles
		SET slug = $2, title = $3, description = $4, content = $5, category = $6, tags = $7,
			author = $8, read_time = $9, featured_image = $10, seo_title = $11, seo_description = $12,
			updated_by = $13, updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`
	return r.pool.QueryRow(ctx, query,
		a.ID, a.Slug, a.Title, a.Description, a.Content, a.Category, a.Tags,
		a.Author, a.ReadTime, a.FeaturedImage, a.SEOTitle, a.SEODescription, a.UpdatedBy,
	).Scan(&a.UpdatedAt)
}

func (r *ArticleRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM public.articles WHERE id = $1", id)
	return err
}

func (r *ArticleRepo) SetStatus(ctx context.Context, id uuid.UUID, status string, userID uuid.UUID) error {
	var publishedAt *time.Time
	if status == "published" {
		now := time.Now()
		publishedAt = &now
	}

	_, err := r.pool.Exec(ctx,
		`UPDATE public.articles SET status = $2, published_at = COALESCE($3, published_at), updated_by = $4, updated_at = NOW() WHERE id = $1`,
		id, status, publishedAt, userID,
	)
	return err
}

func (r *ArticleRepo) CountByStatus(ctx context.Context) (map[string]int, error) {
	rows, err := r.pool.Query(ctx, "SELECT status, COUNT(*) FROM public.articles GROUP BY status")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := map[string]int{}
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		counts[status] = count
	}
	return counts, rows.Err()
}
