// ── Domain Types (Clean UI Data) ──

export type QuestionTypeDomain = 'multiple_choice' | 'essay' | 'upload' | 'observation'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface QuestionOptionDomain {
    id: string
    text: string
    isCorrect: boolean
}

export interface QuestionDomain {
    id: string
    schemeId: string
    schemeName: string
    type: QuestionTypeDomain
    text: string
    options: QuestionOptionDomain[]
    difficulty: DifficultyLevel
    points: number
    isActive: boolean
    rubric?: string
    instructions?: string
    createdAt: Date
    updatedAt: Date
}

export type QuestionFormData = Pick<QuestionDomain, 'schemeId' | 'type' | 'text' | 'difficulty' | 'points' | 'isActive' | 'rubric' | 'instructions'> & {
    options: QuestionOptionDomain[]
}

// ── DTO Types (API snake_case) ──

export interface QuestionOptionDTO {
    id: string
    text: string
    is_correct: boolean
}

export interface QuestionDTO {
    id: string
    scheme_id: string
    scheme_name: string
    question_type: QuestionTypeDomain
    question_text: string
    options: QuestionOptionDTO[]
    difficulty: DifficultyLevel
    points: number
    is_active: boolean
    rubric?: string
    instructions?: string
    created_at: string
    updated_at: string
}

export interface QuestionListResponseDTO {
    data: QuestionDTO[]
    total: number
    page: number
    per_page: number
}
