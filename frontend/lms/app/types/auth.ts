export type UserRole = 'super_admin' | 'admin' | 'quality_manager' | 'assessor' | 'assessee'

/** Matches backend dto.UserResponse */
export interface UserResponseDTO {
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

/** Matches backend dto.LoginResponse (after envelope unwrap) */
export interface LoginResponseDTO {
    user: UserResponseDTO
    access_token: string
    refresh_token: string
    expires_at: string
}

/** Matches backend dto.TokenResponse (after envelope unwrap) */
export interface TokenResponseDTO {
    access_token: string
    refresh_token: string
    expires_at: string
}

export interface AuthUser {
    id: string
    email: string
    fullName: string
    role: UserRole
    tenantId: string
    isActive: boolean
    lastLogin?: Date
}
