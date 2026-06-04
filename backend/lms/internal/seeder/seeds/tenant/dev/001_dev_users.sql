-- Development seed users (password: admin123 for all)
-- bcrypt hash ($2a$10$) for "admin123"

INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
('superadmin@coreasia.id', '$2a$10$CN5up6EJZDCQNE4eCm/mauTvvucKokSAS0vgIt5wJKcciq7.Uo9.q', 'Super Administrator', 'super_admin', true),
('qm@coreasia.id', '$2a$10$CN5up6EJZDCQNE4eCm/mauTvvucKokSAS0vgIt5wJKcciq7.Uo9.q', 'Quality Manager', 'quality_manager', true),
('assessor@coreasia.id', '$2a$10$CN5up6EJZDCQNE4eCm/mauTvvucKokSAS0vgIt5wJKcciq7.Uo9.q', 'Assessor User', 'assessor', true),
('assessee@coreasia.id', '$2a$10$CN5up6EJZDCQNE4eCm/mauTvvucKokSAS0vgIt5wJKcciq7.Uo9.q', 'Assessee User', 'assessee', true)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
