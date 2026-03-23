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

const articleSelectColumns = `a.id, a.slug, a.title, a.description, a.content, a.category, a.tags, a.author,
	a.read_time, a.status, a.featured_image, a.seo_title, a.seo_description,
	a.published_at, a.created_by, creator.full_name AS created_by_name,
	a.updated_by, updater.full_name AS updated_by_name,
	publish_log.user_name AS published_by_name,
	unpublish_log.created_at AS unpublished_at, unpublish_log.user_name AS unpublished_by_name,
	a.created_at, a.updated_at`

const articleFromClause = `FROM public.articles a
	LEFT JOIN public.admin_users creator ON creator.id = a.created_by
	LEFT JOIN public.admin_users updater ON updater.id = a.updated_by
	LEFT JOIN LATERAL (
		SELECT gal.user_name, gal.created_at
		FROM public.gateway_audit_logs gal
		WHERE gal.resource = 'articles'
			AND gal.resource_id = a.id::text
			AND gal.action = 'publish'
		ORDER BY gal.created_at DESC
		LIMIT 1
	) publish_log ON true
	LEFT JOIN LATERAL (
		SELECT gal.user_name, gal.created_at
		FROM public.gateway_audit_logs gal
		WHERE gal.resource = 'articles'
			AND gal.resource_id = a.id::text
			AND gal.action = 'unpublish'
		ORDER BY gal.created_at DESC
		LIMIT 1
	) unpublish_log ON true`

func scanArticle(row pgx.Row) (*model.Article, error) {
	var a model.Article
	err := row.Scan(
		&a.ID, &a.Slug, &a.Title, &a.Description, &a.Content, &a.Category,
		&a.Tags, &a.Author, &a.ReadTime, &a.Status, &a.FeaturedImage,
		&a.SEOTitle, &a.SEODescription, &a.PublishedAt,
		&a.CreatedBy, &a.CreatedByName, &a.UpdatedBy, &a.UpdatedByName,
		&a.PublishedByName, &a.UnpublishedAt, &a.UnpublishedByName,
		&a.CreatedAt, &a.UpdatedAt,
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
			&a.CreatedBy, &a.CreatedByName, &a.UpdatedBy, &a.UpdatedByName,
			&a.PublishedByName, &a.UnpublishedAt, &a.UnpublishedByName,
			&a.CreatedAt, &a.UpdatedAt,
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
		where = append(where, fmt.Sprintf("a.status = $%d", argIdx))
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.Category != "" {
		where = append(where, fmt.Sprintf("a.category = $%d", argIdx))
		args = append(args, filter.Category)
		argIdx++
	}
	if filter.Search != "" {
		where = append(where, fmt.Sprintf("(a.title ILIKE $%d OR a.description ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM public.articles a WHERE %s", whereClause)
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting articles: %w", err)
	}

	query := fmt.Sprintf(`SELECT %s %s WHERE %s ORDER BY a.created_at DESC LIMIT $%d OFFSET $%d`,
		articleSelectColumns, articleFromClause, whereClause, argIdx, argIdx+1)
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
	offset := (page - 1) * perPage
	where := []string{"a.status = 'published'"}
	args := []interface{}{}
	argIdx := 1

	if category != "" {
		where = append(where, fmt.Sprintf("a.category = $%d", argIdx))
		args = append(args, category)
		argIdx++
	}
	if search != "" {
		where = append(where, fmt.Sprintf("(a.title ILIKE $%d OR a.description ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM public.articles a WHERE %s", whereClause)
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("counting published articles: %w", err)
	}

	query := fmt.Sprintf(`SELECT %s %s WHERE %s ORDER BY COALESCE(a.published_at, a.created_at) DESC LIMIT $%d OFFSET $%d`,
		articleSelectColumns, articleFromClause, whereClause, argIdx, argIdx+1)
	args = append(args, perPage, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("listing published articles: %w", err)
	}
	defer rows.Close()

	articles, err := scanArticles(rows)
	return articles, total, err
}

func (r *ArticleRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Article, error) {
	query := fmt.Sprintf("SELECT %s %s WHERE a.id = $1", articleSelectColumns, articleFromClause)
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
	query := fmt.Sprintf("SELECT %s %s WHERE a.slug = $1 AND a.status = 'published'", articleSelectColumns, articleFromClause)
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
