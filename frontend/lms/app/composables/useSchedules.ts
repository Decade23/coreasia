import { ref } from 'vue'
import type { ScheduleDomain, ScheduleFormData, ScheduleListResponseDTO } from '~/types/schedule'
import { ScheduleAdapter } from '~/adapters/ScheduleAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export const useSchedules = () => {
    const schedules = ref<ScheduleDomain[]>([])
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)
    const totalItems = ref(0)
    const currentPage = ref(1)

    const fetchSchedules = async (page = 1) => {
        loading.value = true
        error.value = null
        try {
            const response = await coreApi.get<ScheduleListResponseDTO>('/schedules', {
                page,
                per_page: 10,
            })
            schedules.value = response.data.map(ScheduleAdapter.toDomain)
            totalItems.value = response.total
            currentPage.value = response.page
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat daftar jadwal'
            console.error('[useSchedules] fetchSchedules:', e)
        } finally {
            loading.value = false
        }
    }

    const createSchedule = async (form: ScheduleFormData): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            const dto = ScheduleAdapter.toDTO(form)
            await coreApi.post('/schedules', dto)
            await fetchSchedules(currentPage.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal membuat jadwal baru'
            console.error('[useSchedules] createSchedule:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const updateSchedule = async (id: string, form: ScheduleFormData): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            const dto = ScheduleAdapter.toDTO(form)
            await coreApi.put(`/schedules/${id}`, dto)
            await fetchSchedules(currentPage.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memperbarui jadwal'
            console.error('[useSchedules] updateSchedule:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const deleteSchedule = async (id: string): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.delete(`/schedules/${id}`)
            await fetchSchedules(currentPage.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal menghapus jadwal'
            console.error('[useSchedules] deleteSchedule:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    return {
        schedules,
        loading,
        saving,
        error,
        totalItems,
        currentPage,
        fetchSchedules,
        createSchedule,
        updateSchedule,
        deleteSchedule,
    }
}
