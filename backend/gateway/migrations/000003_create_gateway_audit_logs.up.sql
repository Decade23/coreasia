CREATE TABLE IF NOT EXISTS public.gateway_audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    user_name   VARCHAR(200),
    action      VARCHAR(50)  NOT NULL,
    resource    VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    description TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gateway_audit_logs_created_at ON public.gateway_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gateway_audit_logs_resource   ON public.gateway_audit_logs(resource);
