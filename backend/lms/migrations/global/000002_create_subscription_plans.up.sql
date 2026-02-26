CREATE TABLE IF NOT EXISTS subscription_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    max_assessees   INT NOT NULL DEFAULT 100,
    max_schemes     INT NOT NULL DEFAULT 5,
    features        JSONB NOT NULL DEFAULT '{}',
    price_monthly   DECIMAL(12,2) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenants ADD CONSTRAINT fk_tenants_plan
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);

-- Seed default plans
INSERT INTO subscription_plans (id, name, max_assessees, max_schemes, features, price_monthly) VALUES
    (gen_random_uuid(), 'Essential', 100, 5, '{"cbt": true, "api_access": false, "whatsapp": false}', 2500000),
    (gen_random_uuid(), 'Professional', 500, 20, '{"cbt": true, "api_access": true, "whatsapp": true}', 7500000),
    (gen_random_uuid(), 'Enterprise', 9999, 999, '{"cbt": true, "api_access": true, "whatsapp": true, "custom_domain": true}', 15000000)
ON CONFLICT DO NOTHING;
