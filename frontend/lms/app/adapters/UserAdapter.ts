/**
 * UserAdapter
 * Implements Adapter Pattern to transform Raw API response into Clean UI Interface
 * As per @[.agent/rules/expert-frontend.md]
 */

export interface UserDTO {
    id: string
    full_name: string
    email_address: string
    user_role: 'admin' | 'assessor' | 'assessee'
    is_active_status: boolean
}

export interface UserDomain {
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
}

export const UserAdapter = {
    toDomain(dto: UserDTO): UserDomain {
        return {
            id: dto.id,
            name: dto.full_name,
            email: dto.email_address,
            role: dto.user_role as string,
            isActive: dto.is_active_status
        }
    }
}
