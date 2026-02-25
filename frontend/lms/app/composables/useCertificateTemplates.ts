import { ref } from 'vue'
import type { CertificateTemplateDomain, CertificateTemplateFormData, CertificateTemplateDTO, CertificateTemplateListResponseDTO } from '~/types/certificate'
import { CertificateTemplateAdapter } from '~/adapters/CertificateTemplateAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export const useCertificateTemplates = () => {
    const templates = ref<CertificateTemplateDomain[]>([])
    const currentTemplate = ref<CertificateTemplateDomain | null>(null)
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)
    const totalItems = ref(0)
    const currentPage = ref(1)

    const fetchTemplates = async (page = 1) => {
        loading.value = true
        error.value = null
        try {
            const response = await coreApi.get<CertificateTemplateListResponseDTO>('/certificate-templates', {
                page,
                per_page: 10,
            })
            templates.value = response.data.map(CertificateTemplateAdapter.toDomain)
            totalItems.value = response.total
            currentPage.value = response.page
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat daftar template sertifikat'
            console.error('[useCertificateTemplates] fetchTemplates:', e)
        } finally {
            loading.value = false
        }
    }

    const fetchTemplate = async (id: string) => {
        loading.value = true
        error.value = null
        try {
            const dto = await coreApi.get<CertificateTemplateDTO>(`/certificate-templates/${id}`)
            currentTemplate.value = CertificateTemplateAdapter.toDomain(dto)
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat detail template'
            console.error('[useCertificateTemplates] fetchTemplate:', e)
        } finally {
            loading.value = false
        }
    }

    const createTemplate = async (form: CertificateTemplateFormData): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.post('/certificate-templates', {
                name: form.name,
                description: form.description,
                scheme_id: form.schemeId,
                is_default: form.isDefault,
            })
            await fetchTemplates(currentPage.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal membuat template'
            console.error('[useCertificateTemplates] createTemplate:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const updateTemplate = async (id: string, form: CertificateTemplateFormData): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.put(`/certificate-templates/${id}`, {
                name: form.name,
                description: form.description,
                scheme_id: form.schemeId,
                is_default: form.isDefault,
            })
            await fetchTemplates(currentPage.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memperbarui template'
            console.error('[useCertificateTemplates] updateTemplate:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const deleteTemplate = async (id: string): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.delete(`/certificate-templates/${id}`)
            await fetchTemplates(currentPage.value)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal menghapus template'
            console.error('[useCertificateTemplates] deleteTemplate:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const getFieldTypeLabel = (type: string) => {
        switch (type) {
            case 'text': return 'Teks'
            case 'date': return 'Tanggal'
            case 'image': return 'Gambar'
            case 'qr_code': return 'QR Code'
            default: return type
        }
    }

    return {
        templates,
        currentTemplate,
        loading,
        saving,
        error,
        totalItems,
        currentPage,
        fetchTemplates,
        fetchTemplate,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        getFieldTypeLabel,
    }
}
