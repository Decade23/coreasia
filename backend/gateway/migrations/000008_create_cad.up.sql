-- CoreAsia Download Manager (CAD): license, installation/device, analytics.

CREATE TABLE IF NOT EXISTS public.cad_licenses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key  TEXT         NOT NULL UNIQUE,
    email        VARCHAR(255),
    tier         VARCHAR(20)  NOT NULL DEFAULT 'lifetime',
    status       VARCHAR(20)  NOT NULL DEFAULT 'active',
    order_ref    VARCHAR(120),
    device_limit INT          NOT NULL DEFAULT 2,
    expires_at   TIMESTAMPTZ,
    notes        TEXT,
    created_by   UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_cad_licenses_status ON public.cad_licenses(status);
CREATE INDEX idx_cad_licenses_email  ON public.cad_licenses(email);

CREATE TABLE IF NOT EXISTS public.cad_installations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id  UUID REFERENCES public.cad_licenses(id) ON DELETE CASCADE,
    device_hash VARCHAR(128) NOT NULL,
    app_version VARCHAR(40),
    os_version  VARCHAR(80),
    revoked     BOOLEAN      NOT NULL DEFAULT false,
    first_seen  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_seen   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_cad_install_license_device ON public.cad_installations(license_id, device_hash);
CREATE INDEX idx_cad_install_device ON public.cad_installations(device_hash);

-- Anonymous, privacy-first telemetry. NEVER stores URLs/download history/filenames.
CREATE TABLE IF NOT EXISTS public.cad_analytics_events (
    id          BIGSERIAL PRIMARY KEY,
    install_id  VARCHAR(64)  NOT NULL,
    event_type  VARCHAR(50)  NOT NULL,
    app_version VARCHAR(40),
    os_version  VARCHAR(80),
    country     VARCHAR(2),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_cad_events_type    ON public.cad_analytics_events(event_type);
CREATE INDEX idx_cad_events_created ON public.cad_analytics_events(created_at);
CREATE INDEX idx_cad_events_install ON public.cad_analytics_events(install_id);
