import type { Question, Exam } from '../types/exam'

export const ExamAdapter = {
    toExam(data: any): Exam {
        return {
            id: data.exam_id || data.id,
            title: data.exam_title || data.title,
            description: data.exam_description || data.description,
            durationMinutes: data.duration_min || data.durationMinutes,
            totalPoints: data.total_score || data.totalPoints,
            questions: (data.questions || []).map((q: any) => this.toQuestion(q))
        }
    },

    toQuestion(data: any): Question {
        return {
            id: data.q_id || data.id,
            text: data.content || data.text,
            type: data.q_type || data.type,
            points: data.score || data.points,
            options: (data.choices || data.options || []).map((o: any) => ({
                id: o.choice_id || o.id,
                text: o.text || o.label
            }))
        }
    }
}
