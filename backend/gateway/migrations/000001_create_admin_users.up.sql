CREATE TABLE IF NOT EXISTS public.admin_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(200) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'admin',
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
