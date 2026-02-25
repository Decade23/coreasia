// ── Domain Types ──

export type AssessorLicenseStatus = 'active' | 'expired' | 'pending_renewal'

export interface AssessorLicenseDomain {
    id: string
    licenseNumber: string
    issuedBy: string
    issuedDate: Date
    expiryDate: Date
    status: AssessorLicenseStatus
}

export interface AssessorSchemeDomain {
    schemeId: string
    schemeName: string
    schemeCode: string
    assignedAt: Date
}

export interface AssessorProfileDomain {
    id: string
    fullName: string
    email: string
    phoneNumber: string
    specialization: string
    isActive: boolean
    license: AssessorLicenseDomain | null
    assignedSchemes: AssessorSchemeDomain[]
    totalAssessments: number
    completedAssessments: number
    createdAt: Date
    updatedAt: Date
}

export type AssessorFormData = Pick<AssessorProfileDomain, 'fullName' | 'email' | 'phoneNumber' | 'specialization' | 'isActive'> & {
    licenseNumber: string
    schemeIds: string[]
}

// ── DTO Types (API snake_case) ──

export interface AssessorLicenseDTO {
    id: string
    license_number: string
    issued_by: string
    issued_date: string
    expiry_date: string
    status: AssessorLicenseStatus
}

export interface AssessorSchemeDTO {
    scheme_id: string
    scheme_name: string
    scheme_code: string
    assigned_at: string
}

export interface AssessorProfileDTO {
    id: string
    full_name: string
    email: string
    phone_number: string
    specialization: string
    is_active: boolean
    license: AssessorLicenseDTO | null
    assigned_schemes: AssessorSchemeDTO[]
    total_assessments: number
    completed_assessments: number
    created_at: string
    updated_at: string
}

export interface AssessorListResponseDTO {
    data: AssessorProfileDTO[]
    total: number
    page: number
    per_page: number
}
