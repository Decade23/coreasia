-- Default subscription plans
INSERT INTO subscription_plans (id, name, max_assessees, max_schemes, features, price_monthly) VALUES
    (gen_random_uuid(), 'Essential', 100, 5, '{"cbt": true, "api_access": false, "whatsapp": false}', 2500000),
    (gen_random_uuid(), 'Professional', 500, 20, '{"cbt": true, "api_access": true, "whatsapp": true}', 7500000),
    (gen_random_uuid(), 'Enterprise', 9999, 999, '{"cbt": true, "api_access": true, "whatsapp": true, "custom_domain": true}', 15000000)
ON CONFLICT DO NOTHING;
