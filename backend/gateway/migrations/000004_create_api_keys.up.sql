CREATE TABLE IF NOT EXISTS public.api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    provider    VARCHAR(50)  NOT NULL,
    key_value   TEXT         NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_by  UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_provider ON public.api_keys(provider);
CREATE INDEX idx_api_keys_active   ON public.api_keys(is_active);
