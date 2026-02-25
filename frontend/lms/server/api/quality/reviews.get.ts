export default defineEventHandler(() => {
    const data = [
        {
            id: 'QR-001', assessee_id: 'APP-2026-080', assessee_name: 'Andi Kusuma',
            assessor_id: 'ASR-001', assessor_name: 'Hendrik Kurniawan',
            scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer',
            recommendation: 'competent', assessor_notes: 'Peserta menunjukkan pemahaman yang baik terhadap semua unit kompetensi. Mampu mendemonstrasikan coding secara langsung.',
            manager_notes: '', status: 'pending_review',
            submitted_at: '2026-02-20T14:00:00Z', reviewed_at: undefined,
        },
        {
            id: 'QR-002', assessee_id: 'APP-2026-075', assessee_name: 'Dewi Lestari',
            assessor_id: 'ASR-002', assessor_name: 'Anita Widyastuti',
            scheme_id: 'SCH-002', scheme_name: 'Desainer Grafis Muda',
            recommendation: 'not_competent', assessor_notes: 'Peserta belum memenuhi kriteria pada unit "Membuat Desain Berbasis Vektor". Perlu latihan lebih lanjut.',
            manager_notes: '', status: 'pending_review',
            submitted_at: '2026-02-19T10:00:00Z', reviewed_at: undefined,
        },
        {
            id: 'QR-003', assessee_id: 'APP-2026-070', assessee_name: 'Rudi Hartono',
            assessor_id: 'ASR-001', assessor_name: 'Hendrik Kurniawan',
            scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer',
            recommendation: 'competent', assessor_notes: 'Kompeten di semua unit. Mampu membuat responsive website sesuai standar.',
            manager_notes: 'Disetujui. Hasil asesmen sesuai standar.', status: 'approved',
            submitted_at: '2026-02-15T09:00:00Z', reviewed_at: '2026-02-17T14:00:00Z',
        },
    ]

    return { data, total: data.length, page: 1, per_page: 10 }
})
