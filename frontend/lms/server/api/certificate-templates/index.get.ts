export default defineEventHandler(() => {
    const data = [
        {
            id: 'TPL-001', name: 'Sertifikat Standar BNSP', description: 'Template sertifikat resmi sesuai format BNSP untuk semua skema sertifikasi.',
            scheme_id: '', scheme_name: 'Semua Skema', thumbnail_url: '/img/cert-template-1.png', is_default: true,
            fields: [
                { key: 'holder_name', label: 'Nama Pemegang', type: 'text', position: { x: 50, y: 40 }, font_size: 24 },
                { key: 'scheme_name', label: 'Nama Skema', type: 'text', position: { x: 50, y: 50 }, font_size: 16 },
                { key: 'cert_number', label: 'Nomor Sertifikat', type: 'text', position: { x: 50, y: 60 }, font_size: 12 },
                { key: 'issued_date', label: 'Tanggal Terbit', type: 'date', position: { x: 30, y: 75 }, font_size: 12 },
                { key: 'expiry_date', label: 'Berlaku Hingga', type: 'date', position: { x: 70, y: 75 }, font_size: 12 },
                { key: 'qr_code', label: 'QR Verifikasi', type: 'qr_code', position: { x: 85, y: 85 }, font_size: 0 },
            ],
            created_at: '2025-01-01T08:00:00Z', updated_at: '2025-06-15T10:00:00Z',
        },
        {
            id: 'TPL-002', name: 'Sertifikat JWD Custom', description: 'Template khusus untuk skema Junior Web Developer dengan desain modern.',
            scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer', thumbnail_url: '/img/cert-template-2.png', is_default: false,
            fields: [
                { key: 'holder_name', label: 'Nama Pemegang', type: 'text', position: { x: 50, y: 35 }, font_size: 28 },
                { key: 'holder_photo', label: 'Foto Pemegang', type: 'image', position: { x: 15, y: 25 }, font_size: 0 },
                { key: 'scheme_name', label: 'Nama Skema', type: 'text', position: { x: 50, y: 45 }, font_size: 18 },
                { key: 'cert_number', label: 'Nomor Sertifikat', type: 'text', position: { x: 50, y: 55 }, font_size: 12 },
                { key: 'qr_code', label: 'QR Verifikasi', type: 'qr_code', position: { x: 85, y: 80 }, font_size: 0 },
            ],
            created_at: '2025-03-10T08:00:00Z', updated_at: '2025-08-20T14:00:00Z',
        },
    ]

    return { data, total: data.length, page: 1, per_page: 10 }
})
