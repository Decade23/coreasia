-- Default tenant settings
INSERT INTO tenant_settings (setting_key, setting_value) VALUES
    ('general', '{"institution_name": "LSP CoreAsia", "logo_url": null, "primary_color": "#10b981"}'),
    ('certification', '{"auto_certificate": true, "validity_years": 3, "number_format": "CERT/{year}/{seq}"}'),
    ('notification', '{"email_enabled": true, "whatsapp_enabled": false}')
ON CONFLICT (setting_key) DO NOTHING;
