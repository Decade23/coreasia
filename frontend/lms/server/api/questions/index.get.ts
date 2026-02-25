export default defineEventHandler((event) => {
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const perPage = Number(query.per_page) || 10
    const search = (query.search as string) || ''
    const schemeFilter = (query.scheme_id as string) || ''
    const typeFilter = (query.question_type as string) || ''

    const allQuestions = [
        {
            id: 'Q-001', scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer', question_type: 'multiple_choice',
            question_text: 'Apa fungsi utama dari tag <head> pada dokumen HTML?',
            options: [
                { id: 'A', text: 'Menampilkan konten utama halaman', is_correct: false },
                { id: 'B', text: 'Menyimpan metadata dan referensi resource', is_correct: true },
                { id: 'C', text: 'Membuat navigasi halaman', is_correct: false },
                { id: 'D', text: 'Mengatur layout halaman', is_correct: false },
            ],
            difficulty: 'easy', points: 10, is_active: true,
            created_at: '2025-03-10T08:00:00Z', updated_at: '2025-03-10T08:00:00Z',
        },
        {
            id: 'Q-002', scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer', question_type: 'essay',
            question_text: 'Jelaskan perbedaan antara var, let, dan const dalam JavaScript. Berikan contoh penggunaan masing-masing.',
            options: [], difficulty: 'medium', points: 20, is_active: true,
            rubric: 'Jawaban mencakup: scope (function vs block), hoisting behavior, reassignment rules. Masing-masing dengan contoh kode.',
            created_at: '2025-03-12T08:00:00Z', updated_at: '2025-03-12T08:00:00Z',
        },
        {
            id: 'Q-003', scheme_id: 'SCH-002', scheme_name: 'Desainer Grafis Muda', question_type: 'upload',
            question_text: 'Unggah file desain antarmuka aplikasi seluler dalam format .pdf resolusi tinggi.',
            options: [], difficulty: 'hard', points: 30, is_active: false,
            instructions: 'Format file: PDF atau PNG. Resolusi minimal 300 DPI. Maksimal 10MB.',
            created_at: '2025-04-01T08:00:00Z', updated_at: '2025-04-01T08:00:00Z',
        },
        {
            id: 'Q-004', scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer', question_type: 'multiple_choice',
            question_text: 'Manakah property CSS yang digunakan untuk membuat layout flexbox?',
            options: [
                { id: 'A', text: 'display: grid', is_correct: false },
                { id: 'B', text: 'display: flex', is_correct: true },
                { id: 'C', text: 'display: block', is_correct: false },
                { id: 'D', text: 'display: inline', is_correct: false },
            ],
            difficulty: 'easy', points: 10, is_active: true,
            created_at: '2025-03-15T08:00:00Z', updated_at: '2025-03-15T08:00:00Z',
        },
        {
            id: 'Q-005', scheme_id: 'SCH-002', scheme_name: 'Desainer Grafis Muda', question_type: 'observation',
            question_text: 'Asesor akan mengobservasi peserta dalam proses pembuatan desain logo menggunakan Adobe Illustrator.',
            options: [], difficulty: 'hard', points: 25, is_active: true,
            instructions: 'Observasi mencakup: workflow desain, penggunaan tools, kerapian layer management, dan hasil akhir.',
            created_at: '2025-04-05T08:00:00Z', updated_at: '2025-04-05T08:00:00Z',
        },
        {
            id: 'Q-006', scheme_id: 'SCH-001', scheme_name: 'Junior Web Developer', question_type: 'essay',
            question_text: 'Jelaskan konsep responsive design dan sebutkan minimal 3 teknik yang digunakan untuk membuatnya.',
            options: [], difficulty: 'medium', points: 20, is_active: true,
            rubric: 'Media queries, flexible grid/layout, flexible images, viewport meta tag. Minimal 3 dari 4 teknik disebut.',
            created_at: '2025-03-20T08:00:00Z', updated_at: '2025-03-20T08:00:00Z',
        },
    ]

    let filtered = allQuestions
    if (search) {
        const q = search.toLowerCase()
        filtered = filtered.filter(item => item.question_text.toLowerCase().includes(q))
    }
    if (schemeFilter) {
        filtered = filtered.filter(item => item.scheme_id === schemeFilter)
    }
    if (typeFilter) {
        filtered = filtered.filter(item => item.question_type === typeFilter)
    }

    const start = (page - 1) * perPage
    const data = filtered.slice(start, start + perPage)

    return { data, total: filtered.length, page, per_page: perPage }
})
