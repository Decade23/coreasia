import type { TenantDTO, Tenant } from '~/types/tenant'

export const TenantAdapter = {
    /**
     * Transforms external DTO from Backend into Internal Domain object used by UI
     * Providing fallbacks ensures no UI crashes if backend omits a field
     */
    toDomain(dto: TenantDTO): Tenant {
        return {
            id: dto.id || '',
            name: dto.name || 'Unknown Tenant',
            slug: dto.slug || '',
            domain: dto.domain || '',
            logo: dto.logoUrl || '/img/default-logo.png',
            brandColor: dto.settings?.brandColor || '#3b82f6', // Default blue brand colour
        }
    }
}
