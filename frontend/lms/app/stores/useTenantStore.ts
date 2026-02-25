import { defineStore } from 'pinia'

export interface TenantContext {
    id: string
    name: string
    logoUrl: string
    primaryColor: string
    secondaryColor: string
    domain: string
}

export const useTenantStore = defineStore('tenant', () => {
    const tenant = ref<TenantContext | null>(null)
    const isLoaded = computed(() => !!tenant.value)

    const setTenant = (data: TenantContext) => {
        tenant.value = data
    }

    const clearTenant = () => {
        tenant.value = null
    }

    return {
        tenant,
        isLoaded,
        setTenant,
        clearTenant,
    }
})
