import { TenantAdapter } from '~/adapters/TenantAdapter'
import type { TenantDTO } from '~/types/tenant'

export const useTenantResolver = () => {
    // Try to use a shared state so it only runs once per server request
    const tenant = useState('current-tenant', () => null as any)
    const isPending = ref(false)
    const error = ref<any>(null)

    const resolveTenant = async () => {
        // If tenant is already loaded, skip
        if (tenant.value) return tenant.value

        isPending.value = true
        try {
            // Logic to resolve domain from hostname will go here
            // For now, mock the response from the 'API'
            const mockApiResp: TenantDTO = {
                id: 't-1',
                name: 'CoreAsia',
                slug: 'coreasia',
                domain: 'lms.coreasia.id',
                settings: { brandColor: '#10b981' }
            }

            // Pass the DTO through the adapter before storing!
            tenant.value = TenantAdapter.toDomain(mockApiResp)
        } catch (e: any) {
            error.value = e
        } finally {
            isPending.value = false
        }
    }

    return {
        tenant,
        isPending,
        error,
        resolveTenant
    }
}
