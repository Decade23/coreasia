import type { AuthUserDTO, AuthUser } from '~/types/auth'

export const AuthAdapter = {
    /**
     * Transforms raw User API object to Domain entity
     * - standardizes datetime fields
     * - switches snake_case to camelCase for the UI
     */
    toDomain(dto: AuthUserDTO): AuthUser {
        return {
            id: dto.id,
            email: dto.email,
            fullName: dto.name || 'Anonymous',
            role: dto.role,
            tenantId: dto.tenant_id,
            isActive: dto.is_active ?? true,
            lastLogin: dto.last_login_at ? new Date(dto.last_login_at) : undefined,
        }
    }
}
