-- Default admin user (password: admin123)
-- bcrypt hash for 'admin123'
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES (
    gen_random_uuid(),
    'admin@coreasia.id',
    '$2a$10$CN5up6EJZDCQNE4eCm/mauTvvucKokSAS0vgIt5wJKcciq7.Uo9.q',
    'Administrator',
    'admin',
    true
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
