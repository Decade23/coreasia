-- Development seed users (password: admin123 for all)
-- bcrypt hash ($2a$10$) for "admin123"

INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
('superadmin@coreasia.id', '$2a$10$YZfRhVJGqOp1M5MQ4Y3zGe2YPcVGWfWN6jxL7V6X3KK5VX8mSf6pO', 'Super Administrator', 'super_admin', true),
('qm@coreasia.id', '$2a$10$YZfRhVJGqOp1M5MQ4Y3zGe2YPcVGWfWN6jxL7V6X3KK5VX8mSf6pO', 'Quality Manager', 'quality_manager', true),
('assessor@coreasia.id', '$2a$10$YZfRhVJGqOp1M5MQ4Y3zGe2YPcVGWfWN6jxL7V6X3KK5VX8mSf6pO', 'Assessor User', 'assessor', true),
('assessee@coreasia.id', '$2a$10$YZfRhVJGqOp1M5MQ4Y3zGe2YPcVGWfWN6jxL7V6X3KK5VX8mSf6pO', 'Assessee User', 'assessee', true)
ON CONFLICT (email) DO NOTHING;
