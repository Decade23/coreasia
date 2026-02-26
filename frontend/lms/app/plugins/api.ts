import { coreApi } from '~/services/api/CoreApiService'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    coreApi.configure({
        baseURL: config.public.apiBase as string,
        tenantSlug: config.public.tenantSlug as string,
    })
})
