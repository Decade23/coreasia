import { ref } from 'vue'
import type { PublicVerificationResultDomain, PublicVerificationResultDTO } from '~/types/certificate'
import { CertificateAdapter } from '~/adapters/CertificateAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export const usePublicVerification = () => {
    const result = ref<PublicVerificationResultDomain | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const searched = ref(false)

    const verifyCertificate = async (certificateNumber: string) => {
        loading.value = true
        error.value = null
        searched.value = true
        result.value = null
        try {
            const dto = await coreApi.get<PublicVerificationResultDTO>(`/verify/${certificateNumber}`)
            result.value = CertificateAdapter.toVerificationDomain(dto)
        } catch (e: any) {
            if (e?.status === 404 || e?.statusCode === 404) {
                result.value = null
            } else {
                error.value = e?.data?.message || e?.message || 'Gagal memverifikasi sertifikat'
            }
            console.error('[usePublicVerification] verifyCertificate:', e)
        } finally {
            loading.value = false
        }
    }

    const reset = () => {
        result.value = null
        error.value = null
        searched.value = false
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'expired': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            case 'revoked': return 'bg-red-500/10 text-red-400 border-red-500/20'
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Aktif & Berlaku'
            case 'expired': return 'Kedaluwarsa'
            case 'revoked': return 'Dicabut'
            default: return status
        }
    }

    return {
        result,
        loading,
        error,
        searched,
        verifyCertificate,
        reset,
        getStatusColor,
        getStatusLabel,
    }
}
