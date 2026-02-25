import { ref } from 'vue'
import type { VerificationDomain, VerificationActionPayload, VerificationDTO, VerificationListResponseDTO, VerificationSummaryDTO } from '~/types/verification'
import { VerificationAdapter } from '~/adapters/VerificationAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export const useVerifications = () => {
    const verifications = ref<VerificationDomain[]>([])
    const currentVerification = ref<VerificationDomain | null>(null)
    const summary = ref<VerificationSummaryDTO | null>(null)
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)
    const totalItems = ref(0)
    const currentPage = ref(1)

    const fetchVerifications = async (params: {
        page?: number
        status?: string
    } = {}) => {
        loading.value = true
        error.value = null
        try {
            const response = await coreApi.get<VerificationListResponseDTO>('/verifications', {
                page: params.page || 1,
                per_page: 10,
                status: params.status || '',
            })
            verifications.value = response.data.map(VerificationAdapter.toDomain)
            totalItems.value = response.total
            currentPage.value = response.page
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat daftar verifikasi'
            console.error('[useVerifications] fetchVerifications:', e)
        } finally {
            loading.value = false
        }
    }

    const fetchVerification = async (id: string) => {
        loading.value = true
        error.value = null
        try {
            const dto = await coreApi.get<VerificationDTO>(`/verifications/${id}`)
            currentVerification.value = VerificationAdapter.toDomain(dto)
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat detail verifikasi'
            console.error('[useVerifications] fetchVerification:', e)
        } finally {
            loading.value = false
        }
    }

    const fetchSummary = async () => {
        try {
            summary.value = await coreApi.get<VerificationSummaryDTO>('/verifications/summary')
        } catch (e: any) {
            console.error('[useVerifications] fetchSummary:', e)
        }
    }

    const performAction = async (id: string, payload: VerificationActionPayload): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.put(`/verifications/${id}`, payload)
            await fetchVerification(id)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memproses aksi verifikasi'
            console.error('[useVerifications] performAction:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUBMITTED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            case 'UNDER_REVIEW': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            case 'VERIFIED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'REVISION_NEEDED': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/20'
            default: return 'bg-core-700/50 text-content-muted border-core-600'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'SUBMITTED': return 'Menunggu Verifikasi'
            case 'UNDER_REVIEW': return 'Sedang Direview'
            case 'VERIFIED': return 'Terverifikasi'
            case 'REVISION_NEEDED': return 'Butuh Revisi'
            case 'REJECTED': return 'Ditolak'
            default: return 'Draft Asesi'
        }
    }

    return {
        verifications,
        currentVerification,
        summary,
        loading,
        saving,
        error,
        totalItems,
        currentPage,
        fetchVerifications,
        fetchVerification,
        fetchSummary,
        performAction,
        getStatusColor,
        getStatusLabel,
    }
}
