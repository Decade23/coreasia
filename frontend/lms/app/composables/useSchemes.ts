import { ref, computed } from 'vue'
import type { SchemeDomain, SchemeFormData, SchemeDTO, SchemeListResponseDTO } from '~/types/scheme'
import { SchemeAdapter } from '~/adapters/SchemeAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export const useSchemes = () => {
    const schemes = ref<SchemeDomain[]>([])
    const currentScheme = ref<SchemeDomain | null>(null)
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)
    const totalItems = ref(0)
    const currentPage = ref(1)
    const searchQuery = ref('')

    const fetchSchemes = async (page = 1, search = '') => {
        loading.value = true
        error.value = null
        try {
            const response = await coreApi.get<SchemeListResponseDTO>('/schemes', {
                page,
                per_page: 10,
                search,
            })
            schemes.value = response.data.map(SchemeAdapter.toDomain)
            totalItems.value = response.total
            currentPage.value = response.page
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat daftar skema'
            console.error('[useSchemes] fetchSchemes:', e)
        } finally {
            loading.value = false
        }
    }

    const fetchScheme = async (id: string) => {
        loading.value = true
        error.value = null
        try {
            const dto = await coreApi.get<SchemeDTO>(`/schemes/${id}`)
            currentScheme.value = SchemeAdapter.toDomain(dto)
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat detail skema'
            console.error('[useSchemes] fetchScheme:', e)
        } finally {
            loading.value = false
        }
    }

    const createScheme = async (form: SchemeFormData): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            const dto = SchemeAdapter.toDTO(form)
            await coreApi.post('/schemes', dto)
            await fetchSchemes(currentPage.value, searchQuery.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal membuat skema baru'
            console.error('[useSchemes] createScheme:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const updateScheme = async (id: string, form: SchemeFormData): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            const dto = SchemeAdapter.toDTO(form)
            await coreApi.put(`/schemes/${id}`, dto)
            await fetchSchemes(currentPage.value, searchQuery.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memperbarui skema'
            console.error('[useSchemes] updateScheme:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const deleteScheme = async (id: string): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.delete(`/schemes/${id}`)
            await fetchSchemes(currentPage.value, searchQuery.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal menghapus skema'
            console.error('[useSchemes] deleteScheme:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const activeSchemes = computed(() => schemes.value.filter(s => s.isActive))

    return {
        schemes,
        currentScheme,
        loading,
        saving,
        error,
        totalItems,
        currentPage,
        searchQuery,
        fetchSchemes,
        fetchScheme,
        createScheme,
        updateScheme,
        deleteScheme,
        activeSchemes,
    }
}
