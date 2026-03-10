DROP INDEX IF EXISTS idx_tenant_registrations_payment_reference;

ALTER TABLE tenant_registrations
    DROP COLUMN IF EXISTS payment_checkout_url,
    DROP COLUMN IF EXISTS payment_reference,
    DROP COLUMN IF EXISTS payment_provider;
