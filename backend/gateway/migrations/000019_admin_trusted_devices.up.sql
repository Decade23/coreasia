CREATE TABLE public.admin_trusted_devices (
    id uuid PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
    token_version integer NOT NULL,
    name varchar(120) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    CHECK (expires_at > created_at)
);
CREATE INDEX admin_trusted_devices_owner ON public.admin_trusted_devices(admin_id, created_at DESC);
