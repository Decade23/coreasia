export interface TenantDTO {
    id: string
    name: string
    slug: string
    domain: string
    logoUrl?: string
    settings?: Record<string, any>
}

// Map exactly to internal UI usage (e.g stripping internal DB-only fields if any)
export interface Tenant {
    id: string
    name: string
    slug: string
    domain: string
    logo?: string
    brandColor?: string
}
