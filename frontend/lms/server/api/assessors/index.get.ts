export default defineEventHandler((event) => {
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const perPage = Number(query.per_page) || 10

    const data = [
        {
            id: 'ASR-001', full_name: 'Hendrik Kurniawan', email: 'hendrik@coreasia.id', phone_number: '081234567001',
            specialization: 'Web Development & Programming', is_active: true,
            license: { id: 'LIC-001', license_number: 'MET.000.001234', issued_by: 'BNSP', issued_date: '2024-01-15', expiry_date: '2027-01-15', status: 'active' },
            assigned_schemes: [
                { scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer', scheme_code: 'JWD', assigned_at: '2024-02-01' },
            ],
            total_assessments: 86, completed_assessments: 78,
            created_at: '2024-01-20T08:00:00Z', updated_at: '2026-01-10T10:00:00Z',
        },
        {
            id: 'ASR-002', full_name: 'Anita Widyastuti', email: 'anita@coreasia.id', phone_number: '081234567002',
            specialization: 'Web Development & UI/UX Design', is_active: true,
            license: { id: 'LIC-002', license_number: 'MET.000.001235', issued_by: 'BNSP', issued_date: '2023-06-10', expiry_date: '2026-06-10', status: 'active' },
            assigned_schemes: [
                { scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer', scheme_code: 'JWD', assigned_at: '2023-07-01' },
                { scheme_id: 'SCH-002', scheme_name: 'Desainer Grafis Muda', scheme_code: 'DGM', assigned_at: '2024-01-15' },
            ],
            total_assessments: 124, completed_assessments: 120,
            created_at: '2023-06-15T08:00:00Z', updated_at: '2026-02-01T14:00:00Z',
        },
        {
            id: 'ASR-003', full_name: 'Budi Mulyanto', email: 'budi.m@coreasia.id', phone_number: '081234567003',
            specialization: 'Graphic Design & Multimedia', is_active: true,
            license: { id: 'LIC-003', license_number: 'MET.000.001300', issued_by: 'BNSP', issued_date: '2022-11-01', expiry_date: '2025-11-01', status: 'expired' },
            assigned_schemes: [
                { scheme_id: 'SCH-002', scheme_name: 'Desainer Grafis Muda', scheme_code: 'DGM', assigned_at: '2022-12-01' },
            ],
            total_assessments: 45, completed_assessments: 45,
            created_at: '2022-11-10T08:00:00Z', updated_at: '2025-12-01T09:00:00Z',
        },
        {
            id: 'ASR-004', full_name: 'Ratna Dewi', email: 'ratna@coreasia.id', phone_number: '081234567004',
            specialization: 'Digital Marketing & Analytics', is_active: false,
            license: null,
            assigned_schemes: [],
            total_assessments: 0, completed_assessments: 0,
            created_at: '2025-10-01T08:00:00Z', updated_at: '2025-10-01T08:00:00Z',
        },
    ]

    return { data, total: data.length, page, per_page: perPage }
})
