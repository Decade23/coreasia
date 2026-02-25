export default defineEventHandler((event) => {
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const perPage = Number(query.per_page) || 10
    const search = (query.search as string) || ''

    const allSchemes = [
        {
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
        {
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
        {
            id: 'SCH-003', code: 'DM', name: 'Digital Marketing',
            description: 'Skema sertifikasi kompetensi digital marketing mencakup SEO, SEM, content marketing, dan analitik digital.',
            is_active: false, validity_years: 2, unit_count: 4, assessee_count: 62,
            units: [
                { id: 'U-020', code: 'N.821100.001.01', title: 'Merancang Strategi Digital Marketing', element_count: 5 },
                { id: 'U-021', code: 'N.821100.002.01', title: 'Mengelola Media Sosial', element_count: 4 },
                { id: 'U-022', code: 'N.821100.003.01', title: 'Mengoptimalkan Search Engine', element_count: 3 },
                { id: 'U-023', code: 'N.821100.004.01', title: 'Menganalisis Data Performa Digital', element_count: 4 },
            ],
            created_at: '2025-03-05T08:00:00Z', updated_at: '2025-05-15T09:00:00Z',
        },
        {
            id: 'SCH-004', code: 'PM', name: 'Project Manager',
            description: 'Skema sertifikasi manajer proyek yang mencakup perencanaan, eksekusi, monitoring, dan closing project.',
            is_active: true, validity_years: 3, unit_count: 6, assessee_count: 45,
            units: [
                { id: 'U-030', code: 'P.854300.001.01', title: 'Menginisiasi Proyek', element_count: 3 },
                { id: 'U-031', code: 'P.854300.002.01', title: 'Merencanakan Ruang Lingkup Proyek', element_count: 5 },
                { id: 'U-032', code: 'P.854300.003.01', title: 'Mengelola Jadwal Proyek', element_count: 4 },
                { id: 'U-033', code: 'P.854300.004.01', title: 'Mengelola Biaya Proyek', element_count: 3 },
                { id: 'U-034', code: 'P.854300.005.01', title: 'Mengelola Risiko Proyek', element_count: 4 },
                { id: 'U-035', code: 'P.854300.006.01', title: 'Menutup Proyek', element_count: 2 },
            ],
            created_at: '2025-04-01T08:00:00Z', updated_at: '2025-08-10T11:00:00Z',
        },
    ]

    let filtered = allSchemes
    if (search) {
        const q = search.toLowerCase()
        filtered = allSchemes.filter(s =>
            s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
        )
    }

    const start = (page - 1) * perPage
    const data = filtered.slice(start, start + perPage)

    return {
        data,
        total: filtered.length,
        page,
        per_page: perPage,
    }
})
