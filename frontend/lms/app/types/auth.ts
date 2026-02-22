export interface AuthUserDTO {
    id: string
    email: string
    name: string
    role: 'super_admin' | 'admin' | 'quality_manager' | 'assessor' | 'assessee'
    tenant_id: string
    is_active: boolean
    last_login_at?: string
}

export interface AuthUser {
    id: string
    email: string
    fullName: string
    role: 'super_admin' | 'admin' | 'quality_manager' | 'assessor' | 'assessee'
    tenantId: string
    isActive: boolean
    lastLogin?: Date
}
