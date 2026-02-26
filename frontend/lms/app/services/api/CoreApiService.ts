import { ofetch, type $Fetch } from 'ofetch'

export interface ApiOptions {
    baseURL?: string
    tenantSlug?: string
}

/**
 * Backend response envelope: { data, meta?, errors? }
 * This service automatically unwraps the envelope so consumers
 * receive the data in the shape they expect.
 */
interface BackendEnvelope {
    data: unknown
    meta?: { page: number; per_page: number; total: number }
    errors?: { code: string; message: string; details?: unknown[] }
}

/**
 * CoreApiService
 * Handles all API interactions with the Go backend.
 * - Unwraps backend response envelope ({ data, meta? })
 * - Injects Bearer token and X-Tenant-ID header
 * - Normalizes error responses for composable consumption
 */
export class CoreApiService {
    private fetcher!: $Fetch
    private baseURL: string
    private tenantSlug: string
    private configured = false

    constructor(options: ApiOptions = {}) {
        this.baseURL = options.baseURL || '/api'
        this.tenantSlug = options.tenantSlug || ''
        this.createFetcher()
    }

    /**
     * Configure with Nuxt runtime config. Called by plugins/api.ts.
     */
    configure(options: { baseURL: string; tenantSlug: string }) {
        if (this.configured) return
        this.baseURL = options.baseURL
        this.tenantSlug = options.tenantSlug
        this.createFetcher()
        this.configured = true
    }

    private createFetcher() {
        const tenantSlug = this.tenantSlug

        this.fetcher = ofetch.create({
            baseURL: this.baseURL,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },

            onRequest({ options }) {
                // Inject Bearer token
                const token = useCookie('auth_token').value
                if (token) {
                    options.headers.set('Authorization', `Bearer ${token}`)
                }

                // Inject tenant header
                if (tenantSlug) {
                    options.headers.set('X-Tenant-ID', tenantSlug)
                }
            },

            onResponse({ response }) {
                // Unwrap backend response envelope
                const body = response._data as BackendEnvelope | null
                if (!body || typeof body !== 'object' || !('data' in body)) return

                if (body.meta) {
                    // Paginated: { data: [], meta: { page, per_page, total } }
                    // → flatten to { data: [], page, per_page, total }
                    response._data = {
                        data: body.data,
                        ...body.meta,
                    }
                } else {
                    // Single item: { data: {...} } → unwrap to just the data
                    response._data = body.data
                }
            },

            onResponseError({ response }) {
                const body = response._data as BackendEnvelope | null

                // Extract backend error message for composable error handlers
                // Composables access: e?.data?.message
                if (body?.errors) {
                    response._data = {
                        message: body.errors.message,
                        code: body.errors.code,
                        details: body.errors.details,
                    }
                }

                if (response.status === 401) {
                    console.warn('[CoreApiService] Unauthorized — token may be expired.')
                }
            },
        })
    }

    public async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
        return this.fetcher<T>(url, { method: 'GET', query: params })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async post<T>(url: string, body?: any): Promise<T> {
        return this.fetcher<T>(url, { method: 'POST', body })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async put<T>(url: string, body?: any): Promise<T> {
        return this.fetcher<T>(url, { method: 'PUT', body })
    }

    public async delete<T>(url: string): Promise<T> {
        return this.fetcher<T>(url, { method: 'DELETE' })
    }
}

export const coreApi = new CoreApiService()
