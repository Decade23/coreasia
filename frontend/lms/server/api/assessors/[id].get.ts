export default defineEventHandler((event) => {
    const id = getRouterParam(event, 'id')

    const assessors: Record<string, any> = {
        'ASR-001': {
            id: 'ASR-001', full_name: 'Hendrik Kurniawan', email: 'hendrik@coreasia.id', phone_number: '081234567001',
            specialization: 'Web Development & Programming', is_active: true,
            license: { id: 'LIC-001', license_number: 'MET.000.001234', issued_by: 'BNSP', issued_date: '2024-01-15', expiry_date: '2027-01-15', status: 'active' },
            assigned_schemes: [
                { scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer', scheme_code: 'JWD', assigned_at: '2024-02-01' },
            ],
            total_assessments: 86, completed_assessments: 78,
            created_at: '2024-01-20T08:00:00Z', updated_at: '2026-01-10T10:00:00Z',
        },
    }

    const assessor = assessors[id || '']
    if (!assessor) {
        throw createError({ statusCode: 404, statusMessage: 'Assessor not found' })
    }
    return assessor
})
