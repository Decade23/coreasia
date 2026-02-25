export default defineEventHandler((event) => {
    const certNumber = getRouterParam(event, 'certificate_number')

    const certs: Record<string, any> = {
        'BNSP-JWD-2025-001234': {
            valid: true,
            certificate_number: 'BNSP/JWD/2025/001234',
            holder_name: 'Budi Santoso',
            holder_photo_url: '/img/avatar-placeholder.png',
            scheme_name: 'Junior Web Developer',
            lsp_name: 'LSP CoreAsia Teknologi',
            status: 'active',
            issued_date: '2025-06-15',
            expiry_date: '2028-06-15',
        },
        'BNSP-DGM-2022-008829': {
            valid: true,
            certificate_number: 'BNSP/DGM/2022/008829',
            holder_name: 'Budi Santoso',
            holder_photo_url: '/img/avatar-placeholder.png',
            scheme_name: 'Desainer Grafis Muda',
            lsp_name: 'LSP CoreAsia Teknologi',
            status: 'expired',
            issued_date: '2022-01-05',
            expiry_date: '2025-01-05',
        },
    }

    const result = certs[certNumber!]
    if (!result) {
        throw createError({ statusCode: 404, statusMessage: 'Sertifikat tidak ditemukan' })
    }

    return result
})
