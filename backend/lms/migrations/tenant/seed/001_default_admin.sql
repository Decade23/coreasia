-- Default admin user (password: admin123)
-- bcrypt hash for 'admin123'
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
    gen_random_uuid(),
    'admin@coreasia.id',
    '$2a$10$YZfRhVJGqOp1M5MQ4Y3zGe2YPcVGWfWN6jxL7V6X3KK5VX8mSf6pO',
    'Administrator',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Default tenant settings
INSERT INTO tenant_settings (setting_key, setting_value) VALUES
    ('general', '{"institution_name": "LSP CoreAsia", "logo_url": null, "primary_color": "#10b981"}'),
    ('certification', '{"auto_certificate": true, "validity_years": 3, "number_format": "CERT/{year}/{seq}"}'),
    ('notification', '{"email_enabled": true, "whatsapp_enabled": false}')
ON CONFLICT (setting_key) DO NOTHING;
