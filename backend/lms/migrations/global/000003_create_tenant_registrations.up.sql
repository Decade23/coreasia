CREATE TABLE IF NOT EXISTS tenant_registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id),
    org_name        VARCHAR(200) NOT NULL,
    org_type        VARCHAR(50) NOT NULL,
    admin_email     VARCHAR(200) NOT NULL,
    admin_name      VARCHAR(200) NOT NULL,
    admin_phone     VARCHAR(20),
    password_hash   VARCHAR(200) NOT NULL,
    plan_id         UUID REFERENCES subscription_plans(id),
    payment_status  VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method  VARCHAR(50),
    paid_at         TIMESTAMPTZ,
    amount          DECIMAL(12,2) NOT NULL DEFAULT 0,
    provision_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    provisioned_at  TIMESTAMPTZ,
    is_trial        BOOLEAN NOT NULL DEFAULT false,
    trial_ends_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_registrations_tenant ON tenant_registrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_registrations_email ON tenant_registrations(admin_email);
CREATE INDEX IF NOT EXISTS idx_tenant_registrations_status ON tenant_registrations(provision_status);
