export default defineEventHandler((event) => {
    const id = getRouterParam(event, 'id')

    // Return detailed verification data
    const items: Record<string, any> = {
        'APP-2026-081': {
            id: 'APP-2026-081', assessee_name: 'Budi Santoso', assessee_email: 'budi@email.com',
            scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer', status: 'SUBMITTED',
            documents: [
                { id: 'DOC-001', name: 'KTP_Budi.pdf', type: 'application/pdf', url: '/uploads/ktp_budi.pdf', file_size: 1024000, uploaded_at: '2026-02-20T08:00:00Z' },
                { id: 'DOC-002', name: 'Ijazah_S1.pdf', type: 'application/pdf', url: '/uploads/ijazah_budi.pdf', file_size: 2048000, uploaded_at: '2026-02-20T08:05:00Z' },
                { id: 'DOC-003', name: 'Sertifikat_Pelatihan.jpg', type: 'image/jpeg', url: '/uploads/sertif_budi.jpg', file_size: 512000, uploaded_at: '2026-02-20T08:10:00Z' },
            ],
            personal_data: {
                full_name: 'Budi Santoso', nik: '3171012345678901', place_of_birth: 'Jakarta',
                date_of_birth: '1995-06-15', email: 'budi@email.com', phone_number: '081234567890',
                address: 'Jl. Sudirman No. 123, Jakarta Selatan',
            },
            review_notes: '', reviewed_by: undefined, submitted_at: '2026-02-20T09:30:00Z', reviewed_at: undefined,
            created_at: '2026-02-19T08:00:00Z', updated_at: '2026-02-20T09:30:00Z',
        },
    }

    const item = items[id || '']
    if (!item) {
        throw createError({ statusCode: 404, statusMessage: 'Verification not found' })
    }

    return item
})
