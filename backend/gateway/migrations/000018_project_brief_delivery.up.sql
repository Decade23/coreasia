ALTER TABLE public.contact_leads
  ALTER COLUMN email DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS reference VARCHAR(40),
  ADD COLUMN IF NOT EXISTS request_id UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS payload_hash TEXT,
  ADD COLUMN IF NOT EXISTS preferred_contact VARCHAR(16) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS timeline VARCHAR(24) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS organization VARCHAR(300) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(200) NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_leads_reference ON public.contact_leads(reference) WHERE reference IS NOT NULL;

-- Only new submissions are queued. Historical leads are not notified again.
CREATE TABLE IF NOT EXISTS public.contact_lead_deliveries (
  id BIGSERIAL PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.contact_leads(id),
  channel TEXT NOT NULL CHECK(channel IN ('email','crm')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','retry','blocked','sent','failed')),
  attempts INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_attempt_at TIMESTAMPTZ,
  lease_until TIMESTAMPTZ,
  lease_token UUID,
  last_error TEXT,
  delivered_at TIMESTAMPTZ,
  UNIQUE(lead_id, channel)
);
CREATE INDEX IF NOT EXISTS idx_contact_lead_deliveries_due ON public.contact_lead_deliveries(next_attempt_at)
  WHERE status NOT IN ('sent','failed');
