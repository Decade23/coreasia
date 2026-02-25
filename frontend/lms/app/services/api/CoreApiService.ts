import { ofetch, type $Fetch } from 'ofetch'

export interface ApiOptions {
    baseURL?: string
    headers?: Record<string, string>
}

/**
 * CoreApiService
 * Base class for all API interactions leveraging ofetch.
 * Handles global interceptors, token injection, and error formatting.
 */
export class CoreApiService {
    private fetcher: $Fetch
    private baseURL: string

    constructor(options: ApiOptions = {}) {
        this.baseURL = options.baseURL || '/api'

        this.fetcher = ofetch.create({
            baseURL: this.baseURL,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...options.headers,
            },

            onRequest({ options }) {
                const token = useCookie('auth_token').value
                if (token) {
                    options.headers.set('Authorization', `Bearer ${token}`)
                }
            },

            onResponseError({ response }) {
                if (response.status === 401) {
                    console.warn('[CoreApiService] Unauthorized access.')
                }
                if (response.status === 403) {
                    console.warn('[CoreApiService] Forbidden access.')
                }
            },
        })
    }

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

export const coreApi = new CoreApiService()
