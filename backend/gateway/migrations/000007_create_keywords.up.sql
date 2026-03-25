-- Keyword pool for SEO-targeted article generation
CREATE TABLE IF NOT EXISTS public.keywords (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword         VARCHAR(200) NOT NULL,
    category        VARCHAR(100) NOT NULL DEFAULT 'general',
    search_volume   INTEGER,
    difficulty      INTEGER CHECK (difficulty >= 0 AND difficulty <= 100),
    priority        INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','used','paused')),
    source          VARCHAR(50) NOT NULL DEFAULT 'manual',
    usage_count     INTEGER NOT NULL DEFAULT 0,
    last_used_at    TIMESTAMPTZ,
    created_by      UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_keywords_keyword_unique ON public.keywords(LOWER(keyword));
CREATE INDEX idx_keywords_status_priority ON public.keywords(status, priority DESC);
CREATE INDEX idx_keywords_category ON public.keywords(category);

-- Junction table: article <-> keyword
CREATE TABLE IF NOT EXISTS public.article_keywords (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(article_id, keyword_id)
);

CREATE INDEX idx_article_keywords_article ON public.article_keywords(article_id);
CREATE INDEX idx_article_keywords_keyword ON public.article_keywords(keyword_id);
