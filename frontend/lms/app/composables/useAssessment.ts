import type { CompetencyUnit } from '~/types/assessment'
import { AssessmentAdapter } from '~/adapters/AssessmentAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export const useAssessment = (schemeId?: string) => {
    const units = ref<CompetencyUnit[]>([])
    const pending = ref(false)
    const error = ref<string | null>(null)

    const fetchUnits = async (id?: string) => {
        pending.value = true
        error.value = null
        try {
            const params: Record<string, unknown> = {}
            if (id || schemeId) params.scheme_id = id || schemeId
            const rawUnits = await coreApi.get<unknown[]>('/assessment/units', params)
            units.value = (rawUnits || []).map(u => AssessmentAdapter.toUnit(u))
        } catch (e: unknown) {
            const err = e as { data?: { message?: string }; message?: string }
            error.value = err?.data?.message || err?.message || 'Gagal memuat unit kompetensi'
        } finally {
            pending.value = false
        }
    }

    // Auto-fetch if schemeId provided
    if (schemeId) fetchUnits()

    return {
        units,
        pending,
        error,
        refresh: fetchUnits,
    }
}
