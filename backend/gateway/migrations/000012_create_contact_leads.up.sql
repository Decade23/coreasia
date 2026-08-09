CREATE TABLE IF NOT EXISTS public.contact_leads (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(200) NOT NULL,
    email        VARCHAR(254) NOT NULL,
    phone        VARCHAR(32),
    subject      VARCHAR(100) NOT NULL,
    message      TEXT NOT NULL,
    consent      BOOLEAN NOT NULL CHECK (consent = true),
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status       VARCHAR(20) NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost', 'spam')),

    utm_source   VARCHAR(255),
    utm_medium   VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_content  VARCHAR(255),
    utm_term     VARCHAR(255),
    gclid        VARCHAR(512),
    fbclid       VARCHAR(512),
    landing_page VARCHAR(2048),
    referrer     VARCHAR(2048),

    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_leads_created_at
    ON public.contact_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_leads_status_created_at
    ON public.contact_leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_leads_email
    ON public.contact_leads(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_contact_leads_utm_campaign
    ON public.contact_leads(utm_campaign)
    WHERE utm_campaign IS NOT NULL;
