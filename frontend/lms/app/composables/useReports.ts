import { ref } from 'vue'
import { coreApi } from '~/services/api/CoreApiService'

export interface ReportSummary {
    totalCertificatesIssued: number
    totalAssessments: number
    totalAssessees: number
    totalSchemes: number
    periodStart: string
    periodEnd: string
}

export interface BnspExportParams {
    schemeId: string
    periodStart: string
    periodEnd: string
    format: 'xlsx' | 'csv' | 'pdf'
}

export interface BnspExportResult {
    downloadUrl: string
    fileName: string
    recordCount: number
    generatedAt: string
}

export const useReports = () => {
    const summary = ref<ReportSummary | null>(null)
    const exportResult = ref<BnspExportResult | null>(null)
    const loading = ref(false)
    const exporting = ref(false)
    const error = ref<string | null>(null)

    const fetchSummary = async (periodStart?: string, periodEnd?: string) => {
        loading.value = true
        error.value = null
        try {
            summary.value = await coreApi.get<ReportSummary>('/reports/summary', {
                period_start: periodStart,
                period_end: periodEnd,
            })
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat ringkasan laporan'
            console.error('[useReports] fetchSummary:', e)
        } finally {
            loading.value = false
        }
    }

    const generateBnspExport = async (params: BnspExportParams): Promise<boolean> => {
        exporting.value = true
        error.value = null
        exportResult.value = null
        try {
            exportResult.value = await coreApi.post<BnspExportResult>('/reports/bnsp-export', {
                scheme_id: params.schemeId,
                period_start: params.periodStart,
                period_end: params.periodEnd,
                format: params.format,
            })
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal mengekspor data BNSP'
            console.error('[useReports] generateBnspExport:', e)
            return false
        } finally {
            exporting.value = false
        }
    }

    return {
        summary,
        exportResult,
        loading,
        exporting,
        error,
        fetchSummary,
        generateBnspExport,
    }
}
