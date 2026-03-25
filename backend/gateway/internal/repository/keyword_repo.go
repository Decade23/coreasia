package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/coreasia/gateway/internal/model"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type KeywordRepo struct {
	pool *pgxpool.Pool
}

func NewKeywordRepo(pool *pgxpool.Pool) *KeywordRepo {
	return &KeywordRepo{pool: pool}
}

const kwCols = `id, keyword, category, search_volume, difficulty, priority, status, source, usage_count, last_used_at, created_by, created_at, updated_at`

func scanKeyword(row interface{ Scan(dest ...any) error }) (*model.Keyword, error) {
	var k model.Keyword
	err := row.Scan(&k.ID, &k.Keyword, &k.Category, &k.SearchVolume, &k.Difficulty,
		&k.Priority, &k.Status, &k.Source, &k.UsageCount, &k.LastUsedAt,
		&k.CreatedBy, &k.CreatedAt, &k.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &k, nil
}

func (r *KeywordRepo) FindAll(ctx context.Context, filter model.KeywordListFilter) ([]model.Keyword, int, error) {
	where := []string{"1=1"}
	args := []any{}
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
		where = append(where, fmt.Sprintf("keyword ILIKE $%d", argIdx))
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM public.keywords WHERE `+whereClause, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting keywords: %w", err)
	}

	orderBy := "priority DESC, created_at DESC"
	if filter.SortBy == "usage" {
		orderBy = "usage_count DESC, priority DESC"
	} else if filter.SortBy == "volume" {
		orderBy = "search_volume DESC NULLS LAST, priority DESC"
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	perPage := filter.PerPage
	if perPage < 1 {
		perPage = 20
	}
	offset := (page - 1) * perPage

	args = append(args, perPage, offset)
	q := fmt.Sprintf(`SELECT %s FROM public.keywords WHERE %s ORDER BY %s LIMIT $%d OFFSET $%d`,
		kwCols, whereClause, orderBy, argIdx, argIdx+1)

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("listing keywords: %w", err)
	}
	defer rows.Close()

	var keywords []model.Keyword
	for rows.Next() {
		k, err := scanKeyword(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("scanning keyword: %w", err)
		}
		keywords = append(keywords, *k)
	}
	return keywords, total, nil
}

func (r *KeywordRepo) FindByID(ctx context.Context, id uuid.UUID) (*model.Keyword, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+kwCols+` FROM public.keywords WHERE id = $1`, id)
	k, err := scanKeyword(row)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("finding keyword: %w", err)
	}
	return k, nil
}

func (r *KeywordRepo) FindNextForBot(ctx context.Context, category string, minPriority int, limit int) ([]model.Keyword, error) {
	where := "status = 'active'"
	args := []any{}
	argIdx := 1

	if category != "" {
		where += fmt.Sprintf(" AND category = $%d", argIdx)
		args = append(args, category)
		argIdx++
	}
	if minPriority > 0 {
		where += fmt.Sprintf(" AND priority >= $%d", argIdx)
		args = append(args, minPriority)
		argIdx++
	}

	if limit < 1 {
		limit = 1
	}
	args = append(args, limit)

	q := fmt.Sprintf(`SELECT %s FROM public.keywords WHERE %s ORDER BY priority DESC, usage_count ASC, created_at ASC LIMIT $%d`,
		kwCols, where, argIdx)

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("finding keywords for bot: %w", err)
	}
	defer rows.Close()

	var keywords []model.Keyword
	for rows.Next() {
		k, err := scanKeyword(rows)
		if err != nil {
			return nil, fmt.Errorf("scanning keyword for bot: %w", err)
		}
		keywords = append(keywords, *k)
	}
	return keywords, nil
}

func (r *KeywordRepo) Create(ctx context.Context, k *model.Keyword) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO public.keywords (keyword, category, search_volume, difficulty, priority, source, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, status, usage_count, created_at, updated_at`,
		k.Keyword, k.Category, k.SearchVolume, k.Difficulty, k.Priority, k.Source, k.CreatedBy).
		Scan(&k.ID, &k.Status, &k.UsageCount, &k.CreatedAt, &k.UpdatedAt)
}

func (r *KeywordRepo) CreateBatch(ctx context.Context, keywords []model.Keyword) error {
	if len(keywords) == 0 {
		return nil
	}

	values := []string{}
	args := []any{}
	argIdx := 1
	for _, k := range keywords {
		values = append(values, fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d)",
			argIdx, argIdx+1, argIdx+2, argIdx+3, argIdx+4, argIdx+5, argIdx+6))
		args = append(args, k.Keyword, k.Category, k.SearchVolume, k.Difficulty, k.Priority, k.Source, k.CreatedBy)
		argIdx += 7
	}

	q := `INSERT INTO public.keywords (keyword, category, search_volume, difficulty, priority, source, created_by) VALUES ` +
		strings.Join(values, ", ") + ` ON CONFLICT (LOWER(keyword)) DO NOTHING`

	_, err := r.pool.Exec(ctx, q, args...)
	if err != nil {
		return fmt.Errorf("batch creating keywords: %w", err)
	}
	return nil
}

func (r *KeywordRepo) Update(ctx context.Context, k *model.Keyword) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE public.keywords
		 SET keyword = $2, category = $3, search_volume = $4, difficulty = $5,
		     priority = $6, status = $7, updated_at = now()
		 WHERE id = $1`,
		k.ID, k.Keyword, k.Category, k.SearchVolume, k.Difficulty, k.Priority, k.Status)
	return err
}

func (r *KeywordRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM public.keywords WHERE id = $1`, id)
	return err
}

func (r *KeywordRepo) IncrementUsage(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE public.keywords SET usage_count = usage_count + 1, last_used_at = $2, updated_at = now() WHERE id = $1`,
		id, time.Now())
	return err
}

func (r *KeywordRepo) LinkArticle(ctx context.Context, articleID, keywordID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO public.article_keywords (article_id, keyword_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		articleID, keywordID)
	return err
}

func (r *KeywordRepo) FindByArticleID(ctx context.Context, articleID uuid.UUID) ([]model.Keyword, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT k.`+strings.ReplaceAll(kwCols, ", ", ", k.")+`
		 FROM public.keywords k
		 JOIN public.article_keywords ak ON ak.keyword_id = k.id
		 WHERE ak.article_id = $1`, articleID)
	if err != nil {
		return nil, fmt.Errorf("finding keywords by article: %w", err)
	}
	defer rows.Close()

	var keywords []model.Keyword
	for rows.Next() {
		k, err := scanKeyword(rows)
		if err != nil {
			return nil, fmt.Errorf("scanning article keyword: %w", err)
		}
		keywords = append(keywords, *k)
	}
	return keywords, nil
}

func (r *KeywordRepo) Stats(ctx context.Context) (*model.KeywordStats, error) {
	s := &model.KeywordStats{ByCategory: map[string]int{}}

	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*),
		        COALESCE(SUM(CASE WHEN status='active' THEN 1 ELSE 0 END), 0),
		        COALESCE(SUM(CASE WHEN status='used' THEN 1 ELSE 0 END), 0),
		        COALESCE(SUM(CASE WHEN status='paused' THEN 1 ELSE 0 END), 0)
		 FROM public.keywords`).Scan(&s.Total, &s.Active, &s.Used, &s.Paused)
	if err != nil {
		return nil, fmt.Errorf("keyword stats: %w", err)
	}

	rows, err := r.pool.Query(ctx, `SELECT category, COUNT(*) FROM public.keywords GROUP BY category`)
	if err != nil {
		return nil, fmt.Errorf("keyword category stats: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var cat string
		var count int
		if err := rows.Scan(&cat, &count); err != nil {
			return nil, err
		}
		s.ByCategory[cat] = count
	}
	return s, nil
}
