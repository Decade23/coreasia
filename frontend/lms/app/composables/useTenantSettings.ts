import { ref } from 'vue'
import { coreApi } from '~/services/api/CoreApiService'

export interface TenantGeneral {
    name: string
    license_number: string
    address: string
    phone: string
    email: string
    website: string
}

export interface TenantBranding {
    logo_url: string
    primary_color: string
    secondary_color: string
    custom_domain: string
}

export interface TenantUser {
    id: string
    name: string
    email: string
    role: string
    is_active: boolean
    last_login: string
}

export interface TenantSettings {
    general: TenantGeneral
    branding: TenantBranding
    users: TenantUser[]
}

export const useTenantSettings = () => {
    const settings = ref<TenantSettings | null>(null)
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)

    const fetchSettings = async () => {
        loading.value = true
        error.value = null
        try {
            settings.value = await coreApi.get<TenantSettings>('/tenant/settings')
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat pengaturan tenant'
            console.error('[useTenantSettings] fetchSettings:', e)
        } finally {
            loading.value = false
        }
    }

    const updateGeneral = async (data: TenantGeneral): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.put('/tenant/settings', { general: data })
            if (settings.value) settings.value.general = data
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal menyimpan pengaturan umum'
            console.error('[useTenantSettings] updateGeneral:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const updateBranding = async (data: TenantBranding): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.put('/tenant/settings', { branding: data })
            if (settings.value) settings.value.branding = data
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal menyimpan pengaturan branding'
            console.error('[useTenantSettings] updateBranding:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'super_admin': return 'Super Admin'
            case 'admin': return 'Administrator'
            case 'quality_manager': return 'Manajer Mutu'
            case 'assessor': return 'Asesor'
            case 'assessee': return 'Asesi'
            default: return role
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'super_admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            case 'admin': return 'bg-brand/10 text-brand border-brand/20'
            case 'quality_manager': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            case 'assessor': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            default: return 'bg-core-700/50 text-content-muted border-core-600'
        }
    }

    return {
        settings,
        loading,
        saving,
        error,
        fetchSettings,
        updateGeneral,
        updateBranding,
        getRoleLabel,
        getRoleColor,
    }
}
