import type { $Fetch } from 'ofetch'

export interface ApiOptions {
    baseURL?: string
    headers?: Record<string, string>
}

/**
 * CoreApiService
 * Base class for all API interactions leveraging Nuxt's $fetch (ofetch).
 * Handles global interceptors, token injection, and error formatting.
 */
export class CoreApiService {
    private fetcher: $Fetch
    private baseURL: string

    constructor(options: ApiOptions = {}) {
        // In Nuxt 3, useRuntimeConfig() is typically used for baseURL
        // We default to '/api' for now if not provided
        this.baseURL = options.baseURL || '/api'

        this.fetcher = $fetch.create({
            baseURL: this.baseURL,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers
            },

            onRequest({ request, options }) {
                // Inject Auth Token if available (e.g., from useCookie)
                const token = useCookie('auth_token').value
                if (token) {
                    options.headers = {
                        ...options.headers,
                        Authorization: `Bearer ${token}`
                    }
                }
            },

            onResponseError({ request, response, options }) {
                // Global error handling strategy
                if (response.status === 401) {
                    console.warn('[CoreApiService] Unauthorized access, redirecting to login...')
                    // Nuxt redirection logic will typically be handled in middleware or composable
                }
                if (response.status === 403) {
                    console.warn('[CoreApiService] Forbidden access.')
                }
            }
        })
    }

    // Generic methods for CRUD operations
    public async get<T>(url: string, params?: Record<string, any>): Promise<T> {
        return this.fetcher<T>(url, { method: 'GET', query: params })
    }

    public async post<T>(url: string, body?: any): Promise<T> {
        return this.fetcher<T>(url, { method: 'POST', body })
    }

    public async put<T>(url: string, body?: any): Promise<T> {
        return this.fetcher<T>(url, { method: 'PUT', body })
    }

    public async delete<T>(url: string): Promise<T> {
        return this.fetcher<T>(url, { method: 'DELETE' })
    }
}

// Export a singleton instance for global use
export const coreApi = new CoreApiService()
