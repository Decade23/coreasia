import { $fetch } from 'ofetch'

/**
 * Base configured fetcher for all external API calls.
 * This can be intercepted to add Auth headers or tenant ID headers later.
 */
export const apiFetch = $fetch.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    onRequest({ request, options }) {
        // Inject auth token here if available
        const token = useCookie('auth_token').value
        if (token) {
            options.headers = {
                ...options.headers,
                Authorization: `Bearer ${token}`
            }
        }
    },
    onResponseError({ request, response, options }) {
        // Handle global errors here (e.g. redirect on 401)
        if (response.status === 401) {
            console.warn('Unauthorized request, redirecting to login...')
            // navigateTo('/login')
        }
    }
})
