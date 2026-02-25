import { ref, computed } from 'vue'
import type { IssuedCertificateDomain, IssuedCertificateDTO, IssuedCertificateListResponseDTO } from '~/types/certificate'
import { CertificateAdapter } from '~/adapters/CertificateAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export const useCertificates = () => {
    const certificates = ref<IssuedCertificateDomain[]>([])
    const currentCertificate = ref<IssuedCertificateDomain | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const totalItems = ref(0)
    const currentPage = ref(1)

    const fetchCertificates = async (page = 1) => {
        loading.value = true
        error.value = null
        try {
            const response = await coreApi.get<IssuedCertificateListResponseDTO>('/certificates', { page, per_page: 10 })
            certificates.value = response.data.map(CertificateAdapter.toDomain)
            totalItems.value = response.total
            currentPage.value = response.page
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat daftar sertifikat'
            console.error('[useCertificates] fetchCertificates:', e)
        } finally {
            loading.value = false
        }
    }

    const fetchCertificate = async (id: string) => {
        loading.value = true
        error.value = null
        try {
            const dto = await coreApi.get<IssuedCertificateDTO>(`/certificates/${id}`)
            currentCertificate.value = CertificateAdapter.toDomain(dto)
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat detail sertifikat'
            console.error('[useCertificates] fetchCertificate:', e)
        } finally {
            loading.value = false
        }
    }

    const activeCertificates = computed(() => certificates.value.filter(c => c.status === 'active'))
    const expiredCertificates = computed(() => certificates.value.filter(c => c.status === 'expired'))

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'expired': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            case 'revoked': return 'bg-red-500/10 text-red-400 border-red-500/20'
            default: return 'bg-core-700/50 text-content-muted border-core-600'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Aktif'
            case 'expired': return 'Kedaluwarsa'
            case 'revoked': return 'Dicabut'
            default: return status
        }
    }

    return {
        certificates,
        currentCertificate,
        loading,
        error,
        totalItems,
        currentPage,
        fetchCertificates,
        fetchCertificate,
        activeCertificates,
        expiredCertificates,
        getStatusColor,
        getStatusLabel,
    }
}
