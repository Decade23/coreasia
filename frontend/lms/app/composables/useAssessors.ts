import { ref, computed } from 'vue'
import type { AssessorProfileDomain, AssessorFormData, AssessorProfileDTO, AssessorListResponseDTO } from '~/types/assessor-profile'
import { AssessorProfileAdapter } from '~/adapters/AssessorProfileAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export const useAssessors = () => {
    const assessors = ref<AssessorProfileDomain[]>([])
    const currentAssessor = ref<AssessorProfileDomain | null>(null)
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)
    const totalItems = ref(0)
    const currentPage = ref(1)
    const searchQuery = ref('')

    const fetchAssessors = async (page = 1, search = '') => {
        loading.value = true
        error.value = null
        try {
            const response = await coreApi.get<AssessorListResponseDTO>('/assessors', {
                page,
                per_page: 10,
                search,
            })
            assessors.value = response.data.map(AssessorProfileAdapter.toDomain)
            totalItems.value = response.total
            currentPage.value = response.page
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat daftar asesor'
            console.error('[useAssessors] fetchAssessors:', e)
        } finally {
            loading.value = false
        }
    }

    const fetchAssessor = async (id: string) => {
        loading.value = true
        error.value = null
        try {
            const dto = await coreApi.get<AssessorProfileDTO>(`/assessors/${id}`)
            currentAssessor.value = AssessorProfileAdapter.toDomain(dto)
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat detail asesor'
            console.error('[useAssessors] fetchAssessor:', e)
        } finally {
            loading.value = false
        }
    }

    const createAssessor = async (form: AssessorFormData): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            const dto = AssessorProfileAdapter.toDTO(form)
            await coreApi.post('/assessors', dto)
            await fetchAssessors(currentPage.value, searchQuery.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal menambahkan asesor'
            console.error('[useAssessors] createAssessor:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const updateAssessor = async (id: string, form: AssessorFormData): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            const dto = AssessorProfileAdapter.toDTO(form)
            await coreApi.put(`/assessors/${id}`, dto)
            await fetchAssessors(currentPage.value, searchQuery.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memperbarui asesor'
            console.error('[useAssessors] updateAssessor:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const deleteAssessor = async (id: string): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.delete(`/assessors/${id}`)
            await fetchAssessors(currentPage.value, searchQuery.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal menghapus asesor'
            console.error('[useAssessors] deleteAssessor:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const activeAssessors = computed(() => assessors.value.filter(a => a.isActive))

    const getLicenseStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'expired': return 'bg-red-500/10 text-red-400 border-red-500/20'
            case 'pending_renewal': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            default: return 'bg-core-700/50 text-content-muted border-core-600'
        }
    }

    const getLicenseStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Aktif'
            case 'expired': return 'Kedaluwarsa'
            case 'pending_renewal': return 'Perlu Perpanjangan'
            default: return '-'
        }
    }

    return {
        assessors,
        currentAssessor,
        loading,
        saving,
        error,
        totalItems,
        currentPage,
        searchQuery,
        fetchAssessors,
        fetchAssessor,
        createAssessor,
        updateAssessor,
        deleteAssessor,
        activeAssessors,
        getLicenseStatusColor,
        getLicenseStatusLabel,
    }
}
