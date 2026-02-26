import type { UserResponseDTO, AuthUser } from '~/types/auth'

export const AuthAdapter = {
    /**
     * Transforms backend UserResponseDTO to domain AuthUser.
     * Maps snake_case API fields to camelCase for the UI.
     */
    toDomain(dto: UserResponseDTO, tenantId?: string): AuthUser {
        return {
            id: dto.id,
            email: dto.email,
            fullName: dto.full_name || 'Anonymous',
            role: dto.role,
            tenantId: tenantId || '',
            isActive: dto.is_active ?? true,
            lastLogin: dto.last_login_at ? new Date(dto.last_login_at) : undefined,
        }
    }
}
