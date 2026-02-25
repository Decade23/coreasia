import { ofetch } from 'ofetch'

/**
 * Base configured fetcher for all external API calls.
 * @deprecated Use CoreApiService instead
 */
export const apiFetch = ofetch.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    onRequest({ options }) {
        const token = useCookie('auth_token').value
        if (token) {
            options.headers.set('Authorization', `Bearer ${token}`)
        }
    },
    onResponseError({ response }) {
        if (response.status === 401) {
            console.warn('Unauthorized request, redirecting to login...')
        }
    },
})
