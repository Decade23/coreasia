// ----------------------------------------------------------------------------
// Domain Types (Clean UI Data)
// ----------------------------------------------------------------------------
export interface UserDomain {
    id: string
    fullName: string
    email: string
    phoneNumber: string
    role: 'super_admin' | 'admin' | 'quality_manager' | 'assessor' | 'assessee'
    tenantId: string
    isActive: boolean
    lastLoginAt: Date | null
}

// ----------------------------------------------------------------------------
// DTO Types (Data Transfer Objects from API)
// ----------------------------------------------------------------------------
export interface UserDTO {
    id: string
    tenant_id: string
    email: string
    phone: string
    name: string
    role: 'super_admin' | 'admin' | 'quality_manager' | 'assessor' | 'assessee'
    is_active: boolean
    last_login_at: string | null
}

/**
 * UserAdapter
 * Implements the Anti-Corruption Layer for User/Auth domain.
 * Transforms raw snake_case database output into clean camelCase domain objects.
 */
export class UserAdapter {

    /**
     * Transforms a single User DTO into a Domain object
     */
    public static toDomain(dto: UserDTO): UserDomain {
        return {
            id: dto.id,
            tenantId: dto.tenant_id,
            email: dto.email,
            fullName: dto.name,
            phoneNumber: dto.phone,
            role: dto.role,
            isActive: dto.is_active,
            lastLoginAt: dto.last_login_at ? new Date(dto.last_login_at) : null
        }
    }

    /**
     * Transforms an array of User DTOs into Domain objects
     */
    public static toDomainList(dtos: UserDTO[]): UserDomain[] {
        return dtos.map(this.toDomain)
    }

    /**
     * (Optional) Transforms a Domain object back to a DTO for API submission
     */
    public static toDTO(domain: UserDomain): Partial<UserDTO> {
        return {
            tenant_id: domain.tenantId,
            email: domain.email,
            phone: domain.phoneNumber,
            name: domain.fullName,
            role: domain.role,
            is_active: domain.isActive
        }
    }
}
