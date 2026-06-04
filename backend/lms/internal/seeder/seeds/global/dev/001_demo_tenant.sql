-- Development tenant for local LMS E2E testing.
INSERT INTO tenants (id, name, slug, schema_name, domain, is_active, plan_id)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'CoreAsia Demo LSP',
    'demo',
    'tenant_demo',
    'localhost',
    true,
    (SELECT id FROM subscription_plans WHERE name = 'Professional' ORDER BY created_at LIMIT 1)
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    schema_name = EXCLUDED.schema_name,
    domain = EXCLUDED.domain,
    is_active = EXCLUDED.is_active,
    plan_id = EXCLUDED.plan_id,
    updated_at = NOW();
