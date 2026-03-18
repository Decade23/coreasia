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
