export default defineEventHandler((event) => {
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const perPage = Number(query.per_page) || 10
    const statusFilter = (query.status as string) || ''

    const allItems = [
        {
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
        {
            id: 'APP-2026-082', assessee_name: 'Siti Aminah', assessee_email: 'siti@email.com',
            scheme_id: 'SCH-002', scheme_name: 'Desainer Grafis Muda', status: 'UNDER_REVIEW',
            documents: [
                { id: 'DOC-004', name: 'KTP_Siti.pdf', type: 'application/pdf', url: '/uploads/ktp_siti.pdf', file_size: 980000, uploaded_at: '2026-02-18T10:00:00Z' },
                { id: 'DOC-005', name: 'Portfolio_Design.pdf', type: 'application/pdf', url: '/uploads/portfolio_siti.pdf', file_size: 5120000, uploaded_at: '2026-02-18T10:15:00Z' },
            ],
            personal_data: {
                full_name: 'Siti Aminah', nik: '3171019876543210', place_of_birth: 'Bandung',
                date_of_birth: '1998-03-22', email: 'siti@email.com', phone_number: '082198765432',
                address: 'Jl. Braga No. 45, Bandung',
            },
            review_notes: '', reviewed_by: 'Admin LSP', submitted_at: '2026-02-18T14:15:00Z', reviewed_at: undefined,
            created_at: '2026-02-17T08:00:00Z', updated_at: '2026-02-19T10:00:00Z',
        },
        {
            id: 'APP-2026-080', assessee_name: 'Andi Kusuma', assessee_email: 'andi@email.com',
            scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer', status: 'VERIFIED',
            documents: [
                { id: 'DOC-006', name: 'KTP_Andi.pdf', type: 'application/pdf', url: '/uploads/ktp_andi.pdf', file_size: 890000, uploaded_at: '2026-02-10T08:00:00Z' },
                { id: 'DOC-007', name: 'Ijazah_D3.pdf', type: 'application/pdf', url: '/uploads/ijazah_andi.pdf', file_size: 1500000, uploaded_at: '2026-02-10T08:10:00Z' },
            ],
            personal_data: {
                full_name: 'Andi Kusuma', nik: '3201015432167890', place_of_birth: 'Surabaya',
                date_of_birth: '1997-11-08', email: 'andi@email.com', phone_number: '085611223344',
                address: 'Jl. Pemuda No. 88, Surabaya',
            },
            review_notes: 'Dokumen lengkap, data diri sesuai KTP.', reviewed_by: 'Admin LSP',
            submitted_at: '2026-02-10T10:00:00Z', reviewed_at: '2026-02-12T14:00:00Z',
            created_at: '2026-02-09T08:00:00Z', updated_at: '2026-02-12T14:00:00Z',
        },
        {
            id: 'APP-2026-079', assessee_name: 'Rinawati', assessee_email: 'rina@email.com',
            scheme_id: 'SCH-003', scheme_name: 'Digital Marketing', status: 'REVISION_NEEDED',
            documents: [
                { id: 'DOC-008', name: 'KTP_Rina.pdf', type: 'application/pdf', url: '/uploads/ktp_rina.pdf', file_size: 750000, uploaded_at: '2026-02-08T08:00:00Z' },
            ],
            personal_data: {
                full_name: 'Rinawati', nik: '3301014567891234', place_of_birth: 'Semarang',
                date_of_birth: '1999-01-20', email: 'rina@email.com', phone_number: '087899887766',
                address: 'Jl. Pandanaran No. 12, Semarang',
            },
            review_notes: 'Ijazah belum dilampirkan. Sertifikat pelatihan tidak terlihat jelas.', reviewed_by: 'Admin LSP',
            submitted_at: '2026-02-08T11:00:00Z', reviewed_at: '2026-02-10T09:00:00Z',
            created_at: '2026-02-07T08:00:00Z', updated_at: '2026-02-10T09:00:00Z',
        },
    ]

    let filtered = allItems
    if (statusFilter) {
        filtered = filtered.filter(v => v.status === statusFilter)
    }

    const start = (page - 1) * perPage
    const data = filtered.slice(start, start + perPage)

    return { data, total: filtered.length, page, per_page: perPage }
})
