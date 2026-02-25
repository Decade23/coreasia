export default defineEventHandler((event) => {
    const query = getQuery(event)
    const page = Number(query.page) || 1

    const data = [
        {
            id: 'CERT-001', certificate_number: 'BNSP/JWD/2025/001234',
            holder_name: 'Budi Santoso', holder_photo_url: '/img/avatar-placeholder.png',
            scheme_name: 'Junior Web Developer', scheme_code: 'JWD',
            assessor_name: 'Hendrik Kurniawan', lsp_name: 'LSP CoreAsia Teknologi',
            status: 'active',
            issued_date: '2025-06-15', expiry_date: '2028-06-15',
            download_url: '/api/certificates/CERT-001/download',
            verification_url: 'https://lms.coreasia.id/verify/BNSP-JWD-2025-001234',
            qr_code_data: 'https://lms.coreasia.id/verify/BNSP-JWD-2025-001234',
        },
        {
            id: 'CERT-002', certificate_number: 'BNSP/DGM/2022/008829',
            holder_name: 'Budi Santoso', holder_photo_url: '/img/avatar-placeholder.png',
            scheme_name: 'Desainer Grafis Muda', scheme_code: 'DGM',
            assessor_name: 'Anita Widyastuti', lsp_name: 'LSP CoreAsia Teknologi',
            status: 'expired',
            issued_date: '2022-01-05', expiry_date: '2025-01-05',
            download_url: '/api/certificates/CERT-002/download',
            verification_url: 'https://lms.coreasia.id/verify/BNSP-DGM-2022-008829',
            qr_code_data: 'https://lms.coreasia.id/verify/BNSP-DGM-2022-008829',
        },
        {
            id: 'CERT-003', certificate_number: 'BNSP/JWD/2026/001500',
            holder_name: 'Budi Santoso', holder_photo_url: '/img/avatar-placeholder.png',
            scheme_name: 'Junior Web Developer', scheme_code: 'JWD',
            assessor_name: 'Hendrik Kurniawan', lsp_name: 'LSP CoreAsia Teknologi',
            status: 'active',
            issued_date: '2026-02-01', expiry_date: '2029-02-01',
            download_url: '/api/certificates/CERT-003/download',
            verification_url: 'https://lms.coreasia.id/verify/BNSP-JWD-2026-001500',
            qr_code_data: 'https://lms.coreasia.id/verify/BNSP-JWD-2026-001500',
        },
    ]

    return { data, total: data.length, page, per_page: 10 }
})
