// ── Domain Types (Clean UI Data) ──

export interface UnitCompetencyDomain {
    id: string
    code: string
    title: string
    elementCount: number
}

export interface SchemeDomain {
    id: string
    code: string
    name: string
    description: string
    isActive: boolean
    validityYears: number
    units: UnitCompetencyDomain[]
    unitCount: number
    assesseeCount: number
    createdAt: Date
    updatedAt: Date
}

export type SchemeFormData = Pick<SchemeDomain, 'code' | 'name' | 'description' | 'validityYears' | 'isActive'> & {
    unitIds: string[]
}

// ── DTO Types (API snake_case) ──

export interface UnitCompetencyDTO {
    id: string
    code: string
    title: string
    element_count: number
}

export interface SchemeDTO {
    id: string
    code: string
    name: string
    description: string
    is_active: boolean
    validity_years: number
    units: UnitCompetencyDTO[]
    unit_count: number
    assessee_count: number
    created_at: string
    updated_at: string
}

export interface SchemeListResponseDTO {
    data: SchemeDTO[]
    total: number
    page: number
    per_page: number
}
