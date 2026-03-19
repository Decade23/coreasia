CREATE TABLE IF NOT EXISTS public.articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(300) NOT NULL UNIQUE,
    title           VARCHAR(500) NOT NULL,
    description     TEXT         NOT NULL DEFAULT '',
    content         TEXT         NOT NULL DEFAULT '',
    category        VARCHAR(100) NOT NULL DEFAULT 'general',
    tags            TEXT[]       NOT NULL DEFAULT '{}',
    author          VARCHAR(200) NOT NULL DEFAULT 'Tim CoreAsia',
    read_time       INT          NOT NULL DEFAULT 5,
    status          VARCHAR(20)  NOT NULL DEFAULT 'draft',
    featured_image  VARCHAR(500),
    seo_title       VARCHAR(200),
    seo_description TEXT,
    published_at    TIMESTAMPTZ,
    created_by      UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    updated_by      UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug         ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status       ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category     ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
