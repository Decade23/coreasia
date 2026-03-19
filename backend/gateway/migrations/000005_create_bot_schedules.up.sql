CREATE TABLE IF NOT EXISTS public.bot_schedules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    bot_type    VARCHAR(50)  NOT NULL,
    schedule    VARCHAR(20)  NOT NULL DEFAULT '08:00',
    timezone    VARCHAR(30)  NOT NULL DEFAULT 'Asia/Jakarta',
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    last_run_at TIMESTAMPTZ,
    last_status VARCHAR(20)  DEFAULT 'idle',
    last_error  TEXT,
    run_count   INTEGER      NOT NULL DEFAULT 0,
    config      JSONB        NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_schedules_type ON public.bot_schedules(bot_type);

-- Seed default article bot
INSERT INTO public.bot_schedules (name, bot_type, schedule, timezone, is_active, config)
VALUES (
    'Article Generator',
    'article_generator',
    '08:00',
    'Asia/Jakarta',
    false,
    '{"tone": "professional", "language": "id", "word_count": 1200}'
);
