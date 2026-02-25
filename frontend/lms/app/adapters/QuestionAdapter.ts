import type { QuestionDTO, QuestionDomain, QuestionFormData, QuestionOptionDTO, QuestionOptionDomain } from '~/types/question'

export class QuestionAdapter {

    public static toOptionDomain(dto: QuestionOptionDTO): QuestionOptionDomain {
        return {
            id: dto.id,
            text: dto.text,
            isCorrect: dto.is_correct,
        }
    }

    public static toDomain(dto: QuestionDTO): QuestionDomain {
        return {
            id: dto.id,
            schemeId: dto.scheme_id,
            schemeName: dto.scheme_name,
            type: dto.question_type,
            text: dto.question_text,
            options: dto.options ? dto.options.map(this.toOptionDomain) : [],
            difficulty: dto.difficulty,
            points: dto.points,
            isActive: dto.is_active,
            rubric: dto.rubric,
            instructions: dto.instructions,
            createdAt: new Date(dto.created_at),
            updatedAt: new Date(dto.updated_at),
        }
    }

    public static toDTO(form: QuestionFormData): Record<string, any> {
        return {
            scheme_id: form.schemeId,
            question_type: form.type,
            question_text: form.text,
            difficulty: form.difficulty,
            points: form.points,
            is_active: form.isActive,
            rubric: form.rubric,
            instructions: form.instructions,
            options: form.options.map(opt => ({
                id: opt.id,
                text: opt.text,
                is_correct: opt.isCorrect,
            })),
        }
    }
}
