export default defineEventHandler((event) => {
    const id = getRouterParam(event, 'id')

    const schemes: Record<string, any> = {
        'SCH-001': {
            id: 'SCH-001', code: 'JWD', name: 'Junior Web Developer',
            description: 'Skema sertifikasi kompetensi untuk pengembang web pemula yang mencakup HTML, CSS, JavaScript dasar, dan responsive design.',
            is_active: true, validity_years: 3, unit_count: 5, assessee_count: 128,
            units: [
                { id: 'U-001', code: 'J.620100.001.02', title: 'Menggunakan Struktur Data', element_count: 4 },
                { id: 'U-002', code: 'J.620100.002.02', title: 'Mengimplementasikan User Interface', element_count: 6 },
                { id: 'U-003', code: 'J.620100.003.01', title: 'Mengimplementasikan Algoritma Pemrograman', element_count: 5 },
                { id: 'U-004', code: 'J.620100.004.01', title: 'Melakukan Pengujian Program', element_count: 3 },
                { id: 'U-005', code: 'J.620100.005.01', title: 'Menerapkan Keamanan Aplikasi Web', element_count: 4 },
            ],
            created_at: '2025-01-15T08:00:00Z', updated_at: '2025-06-20T10:30:00Z',
        },
        'SCH-002': {
            id: 'SCH-002', code: 'DGM', name: 'Desainer Grafis Muda',
            description: 'Skema sertifikasi untuk desainer grafis level muda yang mencakup teori desain, penggunaan perangkat lunak grafis, dan pembuatan desain visual.',
            is_active: true, validity_years: 3, unit_count: 3, assessee_count: 85,
            units: [
                { id: 'U-010', code: 'M.742200.001.01', title: 'Merancang Konsep Desain', element_count: 5 },
                { id: 'U-011', code: 'M.742200.002.01', title: 'Mengoperasikan Perangkat Lunak Desain', element_count: 4 },
                { id: 'U-012', code: 'M.742200.003.01', title: 'Membuat Desain Berbasis Vektor & Raster', element_count: 6 },
            ],
            created_at: '2025-02-10T08:00:00Z', updated_at: '2025-07-01T14:00:00Z',
        },
    }

    const scheme = schemes[id || '']
    if (!scheme) {
        throw createError({ statusCode: 404, statusMessage: 'Scheme not found' })
    }

    return scheme
})
