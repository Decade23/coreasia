-- Demo LMS content for local E2E flows.

INSERT INTO schemes (id, code, name, description, is_active, validity_years)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'JWD',
    'Junior Web Developer',
    'Skema demo untuk pengujian LMS end-to-end.',
    true,
    3
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    validity_years = EXCLUDED.validity_years,
    updated_at = NOW();

INSERT INTO unit_competencies (id, scheme_id, code, title, sort_order)
VALUES (
    '11111111-1111-1111-1111-111111111112',
    '11111111-1111-1111-1111-111111111111',
    'JWD.01',
    'Mengimplementasikan antarmuka web',
    1
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    sort_order = EXCLUDED.sort_order;

INSERT INTO competency_elements (id, unit_id, title, sort_order)
VALUES (
    '11111111-1111-1111-1111-111111111113',
    '11111111-1111-1111-1111-111111111112',
    'Membangun halaman web responsif',
    1
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    sort_order = EXCLUDED.sort_order;

INSERT INTO performance_criteria (id, element_id, text, sort_order)
VALUES (
    '11111111-1111-1111-1111-111111111114',
    '11111111-1111-1111-1111-111111111113',
    'Peserta mampu menerapkan struktur, gaya, dan validasi antarmuka.',
    1
)
ON CONFLICT (id) DO UPDATE SET
    text = EXCLUDED.text,
    sort_order = EXCLUDED.sort_order;

INSERT INTO questions (id, scheme_id, question_type, question_text, difficulty, points, is_active)
VALUES
    (
        '22222222-2222-2222-2222-222222222221',
        '11111111-1111-1111-1111-111111111111',
        'multiple_choice',
        'Tag HTML apa yang digunakan untuk membuat tautan?',
        'easy',
        10,
        true
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'essay',
        'Jelaskan cara Anda memastikan halaman web tetap responsif di perangkat mobile.',
        'medium',
        20,
        true
    )
ON CONFLICT (id) DO UPDATE SET
    question_text = EXCLUDED.question_text,
    difficulty = EXCLUDED.difficulty,
    points = EXCLUDED.points,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO question_options (id, question_id, text, is_correct, sort_order)
VALUES
    ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', '<a>', true, 1),
    ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222221', '<button>', false, 2),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222221', '<section>', false, 3)
ON CONFLICT (id) DO UPDATE SET
    text = EXCLUDED.text,
    is_correct = EXCLUDED.is_correct,
    sort_order = EXCLUDED.sort_order;

INSERT INTO schedules (id, title, scheme_id, schedule_type, status, start_date, end_date, location, max_participants)
VALUES (
    '44444444-4444-4444-4444-444444444441',
    'Uji Kompetensi JWD Demo',
    '11111111-1111-1111-1111-111111111111',
    'cbt_online',
    'published',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '30 days',
    'Online',
    30
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    location = EXCLUDED.location,
    updated_at = NOW();

INSERT INTO assessor_profiles (user_id, specialization, license_number, license_issued_by, license_issued_at, license_expiry_at, license_status)
SELECT id, 'Web Development', 'MET.000.000001', 'BNSP', NOW() - INTERVAL '1 year', NOW() + INTERVAL '2 years', 'active'
FROM users
WHERE email = 'assessor@coreasia.id'
ON CONFLICT (user_id) DO UPDATE SET
    specialization = EXCLUDED.specialization,
    license_number = EXCLUDED.license_number,
    license_expiry_at = EXCLUDED.license_expiry_at,
    license_status = EXCLUDED.license_status;

INSERT INTO assessor_schemes (assessor_id, scheme_id)
SELECT id, '11111111-1111-1111-1111-111111111111'
FROM users
WHERE email = 'assessor@coreasia.id'
ON CONFLICT (assessor_id, scheme_id) DO NOTHING;

INSERT INTO schedule_assessors (schedule_id, assessor_id)
SELECT '44444444-4444-4444-4444-444444444441', id
FROM users
WHERE email = 'assessor@coreasia.id'
ON CONFLICT (schedule_id, assessor_id) DO NOTHING;

INSERT INTO verifications (id, assessee_id, scheme_id, status, personal_data, submitted_at)
SELECT
    '55555555-5555-5555-5555-555555555551',
    id,
    '11111111-1111-1111-1111-111111111111',
    'VERIFIED',
    '{"nama_lengkap":"Assessee User","nomor_nik":"3201010101010001","email_peserta":"assessee@coreasia.id"}'::jsonb,
    NOW() - INTERVAL '3 days'
FROM users
WHERE email = 'assessee@coreasia.id'
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    personal_data = EXCLUDED.personal_data,
    submitted_at = EXCLUDED.submitted_at,
    updated_at = NOW();

INSERT INTO exams (id, assessee_id, schedule_id, scheme_id, status, started_at)
SELECT
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    id,
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    'in_progress',
    NOW()
FROM users
WHERE email = 'assessee@coreasia.id'
ON CONFLICT (id) DO UPDATE SET
    status = 'in_progress',
    started_at = COALESCE(exams.started_at, EXCLUDED.started_at),
    submitted_at = NULL,
    score = NULL;

INSERT INTO assessments (id, assessee_id, assessor_id, scheme_id, schedule_id, recommendation, assessor_notes, status)
SELECT
    '66666666-6666-6666-6666-666666666661',
    assessee.id,
    assessor.id,
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    NULL,
    NULL,
    'in_progress'
FROM users assessee
CROSS JOIN users assessor
WHERE assessee.email = 'assessee@coreasia.id'
  AND assessor.email = 'assessor@coreasia.id'
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    recommendation = EXCLUDED.recommendation,
    assessor_notes = EXCLUDED.assessor_notes;

INSERT INTO certificate_templates (id, name, description, scheme_id, is_default)
VALUES (
    '77777777-7777-7777-7777-777777777771',
    'Template Sertifikat Demo',
    'Template lokal untuk validasi daftar sertifikat.',
    '11111111-1111-1111-1111-111111111111',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_default = EXCLUDED.is_default,
    updated_at = NOW();

INSERT INTO certificates (id, certificate_number, assessee_id, scheme_id, template_id, assessor_id, status, issued_date, expiry_date, download_url, qr_code_data)
SELECT
    '88888888-8888-8888-8888-888888888881',
    'COREASIA-JWD-2026-0001',
    assessee.id,
    '11111111-1111-1111-1111-111111111111',
    '77777777-7777-7777-7777-777777777771',
    assessor.id,
    'active',
    (CURRENT_DATE - INTERVAL '30 days')::date,
    (CURRENT_DATE + INTERVAL '3 years')::date,
    'https://example.local/certificates/COREASIA-JWD-2026-0001.pdf',
    'COREASIA-JWD-2026-0001'
FROM users assessee
CROSS JOIN users assessor
WHERE assessee.email = 'assessee@coreasia.id'
  AND assessor.email = 'assessor@coreasia.id'
ON CONFLICT (certificate_number) DO UPDATE SET
    status = EXCLUDED.status,
    expiry_date = EXCLUDED.expiry_date,
    download_url = EXCLUDED.download_url,
    qr_code_data = EXCLUDED.qr_code_data;
