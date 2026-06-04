-- Default subscription plans
INSERT INTO subscription_plans (id, name, max_assessees, max_schemes, features, price_monthly)
SELECT gen_random_uuid(), seed.name, seed.max_assessees, seed.max_schemes, seed.features::jsonb, seed.price_monthly
FROM (
    VALUES
        ('Essential', 100, 5, '{"cbt": true, "api_access": false, "whatsapp": false}', 2500000),
        ('Professional', 500, 20, '{"cbt": true, "api_access": true, "whatsapp": true}', 7500000),
        ('Enterprise', 9999, 999, '{"cbt": true, "api_access": true, "whatsapp": true, "custom_domain": true}', 15000000)
) AS seed(name, max_assessees, max_schemes, features, price_monthly)
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_plans existing WHERE existing.name = seed.name
);
