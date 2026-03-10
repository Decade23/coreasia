ALTER TABLE tenant_registrations
    ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
    ADD COLUMN IF NOT EXISTS payment_checkout_url TEXT;

CREATE INDEX IF NOT EXISTS idx_tenant_registrations_payment_reference
    ON tenant_registrations(payment_reference);
