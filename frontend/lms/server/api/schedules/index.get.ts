export default defineEventHandler((event) => {
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const perPage = Number(query.per_page) || 10

    const data = [
        {
            id: 'JAD-1201', title: 'Ujian JWD Gelombang 1', scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer',
            schedule_type: 'cbt_online', status: 'published',
            start_date: '2026-03-20T08:00:00Z', end_date: '2026-03-21T17:00:00Z',
            location: 'LMS CoreAsia', max_participants: 50, current_participants: 45,
            assessors: [
                { id: 'ASR-001', name: 'Hendrik Kurniawan', initials: 'HK' },
                { id: 'ASR-002', name: 'Anita Widyastuti', initials: 'AW' },
            ],
            created_at: '2025-10-01T08:00:00Z', updated_at: '2025-12-10T10:00:00Z',
        },
        {
            id: 'JAD-1202', title: 'Ujian Praktek Desain Grafis', scheme_id: 'SCH-002', scheme_name: 'Desainer Grafis Muda',
            schedule_type: 'lab_offline', status: 'published',
            start_date: '2026-03-25T09:00:00Z', end_date: '2026-03-25T16:00:00Z',
            location: 'Lab Komputer A, Gedung Utama Lt. 3', max_participants: 20, current_participants: 20,
            assessors: [
                { id: 'ASR-003', name: 'Budi Mulyanto', initials: 'BM' },
            ],
            created_at: '2025-10-15T08:00:00Z', updated_at: '2025-11-20T14:00:00Z',
        },
        {
            id: 'JAD-1203', title: 'Ujian Digital Marketing Batch 2', scheme_id: 'SCH-003', scheme_name: 'Digital Marketing',
            schedule_type: 'hybrid', status: 'draft',
            start_date: '2026-04-10T08:00:00Z', end_date: '2026-04-11T17:00:00Z',
            location: 'Online + Ruang Meeting B', max_participants: 30, current_participants: 0,
            assessors: [],
            created_at: '2025-12-01T08:00:00Z', updated_at: '2025-12-01T08:00:00Z',
        },
    ]

    return { data, total: data.length, page, per_page: perPage }
})
