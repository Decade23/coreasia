import { ref } from 'vue'
import type {
    QualityStatsDomain, QualityStatsDTO,
    QualityReviewDomain, QualityReviewDTO, QualityReviewListResponseDTO,
    AuditLogDomain, AuditLogListResponseDTO,
} from '~/types/quality'
import { QualityAdapter } from '~/adapters/QualityAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export const useQualityManager = () => {
    const stats = ref<QualityStatsDomain | null>(null)
    const reviews = ref<QualityReviewDomain[]>([])
    const currentReview = ref<QualityReviewDomain | null>(null)
    const auditLogs = ref<AuditLogDomain[]>([])
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)
    const totalReviews = ref(0)
    const totalLogs = ref(0)
    const currentPage = ref(1)

    const fetchStats = async () => {
        loading.value = true
        error.value = null
        try {
            const dto = await coreApi.get<QualityStatsDTO>('/quality/stats')
            stats.value = QualityAdapter.toStatsDomain(dto)
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat statistik mutu'
            console.error('[useQualityManager] fetchStats:', e)
        } finally {
            loading.value = false
        }
    }

    const fetchReviews = async (page = 1) => {
        loading.value = true
        error.value = null
        try {
            const response = await coreApi.get<QualityReviewListResponseDTO>('/quality/reviews', {
                page,
                per_page: 10,
            })
            reviews.value = response.data.map(QualityAdapter.toReviewDomain)
            totalReviews.value = response.total
            currentPage.value = response.page
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat daftar review'
            console.error('[useQualityManager] fetchReviews:', e)
        } finally {
            loading.value = false
        }
    }

    const submitReview = async (id: string, status: 'approved' | 'rejected' | 'revision_needed', managerNotes: string): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.put(`/quality/reviews/${id}`, {
                status,
                manager_notes: managerNotes,
            })
            await fetchReviews(currentPage.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal mengirim review'
            console.error('[useQualityManager] submitReview:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const fetchAuditLogs = async (page = 1) => {
        loading.value = true
        error.value = null
        try {
            const response = await coreApi.get<AuditLogListResponseDTO>('/quality/audit-trail', { page, per_page: 10 })
            auditLogs.value = response.data.map(QualityAdapter.toAuditLogDomain)
            totalLogs.value = response.total
            currentPage.value = response.page
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat audit trail'
            console.error('[useQualityManager] fetchAuditLogs:', e)
        } finally {
            loading.value = false
        }
    }

    const getReviewStatusColor = (status: string) => {
        switch (status) {
            case 'pending_review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20'
            case 'revision_needed': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            default: return 'bg-core-700/50 text-content-muted border-core-600'
        }
    }

    const getReviewStatusLabel = (status: string) => {
        switch (status) {
            case 'pending_review': return 'Menunggu Review'
            case 'approved': return 'Disetujui'
            case 'rejected': return 'Ditolak'
            case 'revision_needed': return 'Perlu Revisi'
            default: return status
        }
    }

    const getRecommendationLabel = (rec: string) => {
        switch (rec) {
            case 'competent': return 'Kompeten'
            case 'not_competent': return 'Belum Kompeten'
            default: return rec
        }
    }

    const getRecommendationColor = (rec: string) => {
        switch (rec) {
            case 'competent': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'not_competent': return 'bg-red-500/10 text-red-400 border-red-500/20'
            default: return 'bg-core-700/50 text-content-muted border-core-600'
        }
    }

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'login': return '🔑'
            case 'create': return '➕'
            case 'update': return '✏️'
            case 'delete': return '🗑️'
            case 'approve': return '✅'
            case 'reject': return '❌'
            case 'submit': return '📤'
            case 'review': return '📋'
            default: return '📌'
        }
    }

    return {
        stats,
        reviews,
        currentReview,
        auditLogs,
        loading,
        saving,
        error,
        totalReviews,
        totalLogs,
        currentPage,
        fetchStats,
        fetchReviews,
        submitReview,
        fetchAuditLogs,
        getReviewStatusColor,
        getReviewStatusLabel,
        getRecommendationLabel,
        getRecommendationColor,
        getActionIcon,
    }
}
