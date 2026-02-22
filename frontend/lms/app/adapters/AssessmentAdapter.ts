import type { CompetencyUnit, CompetencyElement, PerformanceCriteria } from '../types/assessment'

export const AssessmentAdapter = {
    toUnit(data: any): CompetencyUnit {
        return {
            id: data.unit_id || data.id,
            code: data.unit_code || data.code,
            title: data.unit_title || data.title,
            elements: (data.elements || []).map((e: any) => this.toElement(e))
        }
    },

    toElement(data: any): CompetencyElement {
        return {
            id: data.element_id || data.id,
            title: data.element_title || data.title,
            criteria: (data.criteria || []).map((c: any) => this.toCriteria(c))
        }
    },

    toCriteria(data: any): PerformanceCriteria {
        return {
            id: data.kuk_id || data.id,
            text: data.kuk_text || data.text,
            status: data.status || null,
            evidenceId: data.evidence_id || data.evidenceId
        }
    }
}
