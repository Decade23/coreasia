import type { UserRole } from '~/types/auth'

// ----------------------------------------------------------------------------
// Domain Types (Clean UI Data)
// ----------------------------------------------------------------------------
export interface UserDomain {
    id: string
    fullName: string
    email: string
    phoneNumber: string
    role: UserRole
    tenantId: string
    isActive: boolean
    lastLoginAt: Date | null
}

// ----------------------------------------------------------------------------
// DTO Types — matches backend dto.UserResponse
// ----------------------------------------------------------------------------
export interface UserDTO {
    id: string
    email: string
    full_name: string
    phone_number: string | null
    role: UserRole
    is_active: boolean
    last_login_at: string | null
    created_at: string
    updated_at: string
}

/**
 * UserAdapter
 * Implements the Anti-Corruption Layer for User/Auth domain.
 * Transforms raw snake_case backend output into clean camelCase domain objects.
 */
export class UserAdapter {
    public static toDomain(dto: UserDTO, tenantId?: string): UserDomain {
        return {
            id: dto.id,
            tenantId: tenantId || '',
            email: dto.email,
            fullName: dto.full_name,
            phoneNumber: dto.phone_number || '',
            role: dto.role,
            isActive: dto.is_active,
            lastLoginAt: dto.last_login_at ? new Date(dto.last_login_at) : null
        }
    }

    public static toDomainList(dtos: UserDTO[], tenantId?: string): UserDomain[] {
        return dtos.map(d => this.toDomain(d, tenantId))
    }

    public static toCreatePayload(domain: Partial<UserDomain>): Record<string, unknown> {
        return {
            email: domain.email,
            full_name: domain.fullName,
            phone_number: domain.phoneNumber || null,
            role: domain.role,
            is_active: domain.isActive ?? true,
        }
    }
}
