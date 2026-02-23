// ----------------------------------------------------------------------------
// Domain Types (Clean UI Data for Exam Engine)
// ----------------------------------------------------------------------------
export type QuestionTypeDomain = 'multiple_choice' | 'essay' | 'upload' | 'observation'

export interface QuestionOptionDomain {
    id: string
    label: string
    value: string
}

export interface ExamQuestionDomain {
    id: string
    type: QuestionTypeDomain
    text: string
    options?: QuestionOptionDomain[]
    correctAnswer?: string
    points: number
    isRequired: boolean
}

export interface ExamDomain {
    id: string
    schemeId: string
    title: string
    durationMinutes: number
    questions: ExamQuestionDomain[]
    passingScore: number
}

// ----------------------------------------------------------------------------
// DTO Types (Data Transfer Objects from API)
// ----------------------------------------------------------------------------
export interface QuestionOptionDTO {
    id: string
    label: string
    value: string
}

export interface ExamQuestionDTO {
    id: string
    question_type: 'multiple_choice' | 'essay' | 'upload' | 'observation'
    question_text: string
    options?: QuestionOptionDTO[]
    correct_answer?: string
    points: number
    is_required: boolean
}

export interface ExamDTO {
    id: string
    scheme_id: string
    title: string
    duration_minutes: number
    questions: ExamQuestionDTO[]
    passing_score: number
}

/**
 * ExamAdapter
 * Implements Anti-Corruption Layer for the CBT Exam Engine.
 * Ensures the UI always receives a consistent `ExamDomain` structure.
 */
export class ExamAdapter {

    /**
     * Transforms a single Question DTO to Domain representation.
     */
    public static toQuestionDomain(dto: ExamQuestionDTO): ExamQuestionDomain {
        return {
            id: dto.id,
            type: dto.question_type, // Enum matches directly
            text: dto.question_text,
            options: dto.options ? dto.options.map(opt => ({
                id: opt.id,
                label: opt.label,
                value: opt.value
            })) : undefined,
            correctAnswer: dto.correct_answer,
            points: dto.points,
            isRequired: dto.is_required
        }
    }

    /**
     * Transforms a full Exam DTO into a Domain object ready for UI injection.
     */
    public static toDomain(dto: ExamDTO): ExamDomain {
        return {
            id: dto.id,
            schemeId: dto.scheme_id,
            title: dto.title,
            durationMinutes: dto.duration_minutes,
            passingScore: dto.passing_score,
            questions: dto.questions ? dto.questions.map(this.toQuestionDomain) : []
        }
    }
}
