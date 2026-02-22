export type QuestionType = 'multiple_choice' | 'essay' | 'boolean'

export interface Option {
    id: string
    text: string
}

export interface Question {
    id: string
    text: string
    type: QuestionType
    options?: Option[]
    points: number
}

export interface Exam {
    id: string
    title: string
    description: string
    durationMinutes: number
    totalPoints: number
    questions: Question[]
}

export interface ExamSession {
    examId: string
    startTime: string
    answers: Record<string, string | string[]>
    isFinished: boolean
}

export const MOCK_EXAM: Exam = {
    id: 'EXAM-2026-001',
    title: 'Sertifikasi Junior Web Developer',
    description: 'Ujian kompetensi dasar untuk sertifikasi profesi Programmer.',
    durationMinutes: 60,
    totalPoints: 100,
    questions: [
        {
            id: 'Q1',
            text: 'Manakah yang merupakan elemen semantik pada HTML5?',
            type: 'multiple_choice',
            points: 10,
            options: [
                { id: 'A', text: '<div>' },
                { id: 'B', text: '<section>' },
                { id: 'C', text: '<span>' },
                { id: 'D', text: '<font>' }
            ]
        },
        {
            id: 'Q2',
            text: 'Apa kepanjangan dari CSS?',
            type: 'multiple_choice',
            points: 10,
            options: [
                { id: 'A', text: 'Cascading Style Sheets' },
                { id: 'B', text: 'Computer Style Syntax' },
                { id: 'C', text: 'Creative Style System' },
                { id: 'D', text: 'Compact Style Sheet' }
            ]
        }
    ]
}
