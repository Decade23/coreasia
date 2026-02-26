import { TenantAdapter } from '~/adapters/TenantAdapter'
import type { TenantDTO } from '~/types/tenant'
import { coreApi } from '~/services/api/CoreApiService'

export const useTenantResolver = () => {
    const tenant = useState('current-tenant', () => null as ReturnType<typeof TenantAdapter.toDomain> | null)
    const isPending = ref(false)
    const error = ref<string | null>(null)

    const resolveTenant = async () => {
        if (tenant.value) return tenant.value

        isPending.value = true
        try {
            const dto = await coreApi.get<TenantDTO>('/tenant/settings')
            tenant.value = TenantAdapter.toDomain(dto)
        } catch (e: unknown) {
            const err = e as { data?: { message?: string }; message?: string }
            error.value = err?.data?.message || err?.message || 'Gagal memuat data tenant'
        } finally {
            isPending.value = false
        }
    }

    return {
        tenant,
        isPending,
        error,
        resolveTenant,
    }
}
