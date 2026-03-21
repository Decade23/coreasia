CREATE TABLE IF NOT EXISTS public.app_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT         NOT NULL DEFAULT '',
    updated_by  UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Default AI settings
INSERT INTO public.app_settings (key, value) VALUES
    ('ai_enabled', 'true'),
    ('ai_provider', 'claude'),
    ('ai_model', 'claude-sonnet-4-6-20250514')
ON CONFLICT (key) DO NOTHING;
