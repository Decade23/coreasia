export default defineEventHandler((event) => {
    const id = getRouterParam(event, 'id')

    // Mock exam data in DTO format (snake_case)
    return {
        id: id || 'EXAM-2026-001',
        scheme_id: 'SKM-JWD-01',
        title: 'Sertifikasi Junior Web Developer',
        duration_minutes: 60,
        passing_score: 70,
        questions: [
            {
                id: 'Q1',
                question_type: 'multiple_choice',
                question_text: 'Manakah yang merupakan elemen semantik pada HTML5?',
                options: [
                    { id: 'A', label: 'A', value: '<div>' },
                    { id: 'B', label: 'B', value: '<section>' },
                    { id: 'C', label: 'C', value: '<span>' },
                    { id: 'D', label: 'D', value: '<font>' },
                ],
                correct_answer: 'B',
                points: 10,
                is_required: true,
            },
            {
                id: 'Q2',
                question_type: 'multiple_choice',
                question_text: 'Apa kepanjangan dari CSS?',
                options: [
                    { id: 'A', label: 'A', value: 'Cascading Style Sheets' },
                    { id: 'B', label: 'B', value: 'Computer Style Syntax' },
                    { id: 'C', label: 'C', value: 'Creative Style System' },
                    { id: 'D', label: 'D', value: 'Compact Style Sheet' },
                ],
                correct_answer: 'A',
                points: 10,
                is_required: true,
            },
            {
                id: 'Q3',
                question_type: 'essay',
                question_text: 'Jelaskan perbedaan antara CSS Flexbox dan CSS Grid. Kapan sebaiknya masing-masing digunakan?',
                points: 20,
                is_required: true,
            },
            {
                id: 'Q4',
                question_type: 'upload',
                question_text: 'Upload screenshot hasil implementasi halaman responsive yang telah Anda buat sesuai desain yang diberikan.',
                points: 30,
                is_required: true,
            },
            {
                id: 'Q5',
                question_type: 'observation',
                question_text: 'Asesor akan mengobservasi kemampuan peserta dalam melakukan debugging pada kode JavaScript yang diberikan.',
                points: 30,
                is_required: false,
            },
        ],
    }
})
