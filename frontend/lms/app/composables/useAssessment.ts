import type { CompetencyUnit } from '~/types/assessment'
import { AssessmentAdapter } from '~/adapters/AssessmentAdapter'

export const useAssessment = () => {
    const { data: rawUnits, pending, error, refresh } = useFetch<any[]>('/api/assessment/units')

    const units = computed<CompetencyUnit[]>(() => {
        if (!rawUnits.value) return []
        return rawUnits.value.map(u => AssessmentAdapter.toUnit(u))
    })

    return {
        units,
        pending,
        error,
        refresh
    }
}
