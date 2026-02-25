// ── Domain Types ──

export type CertificateStatus = 'active' | 'expired' | 'revoked'

export interface CertificateTemplateDomain {
    id: string
    name: string
    description: string
    schemeId: string
    schemeName: string
    thumbnailUrl: string
    isDefault: boolean
    fields: CertificateFieldDomain[]
    createdAt: Date
    updatedAt: Date
}

export interface CertificateFieldDomain {
    key: string
    label: string
    type: 'text' | 'date' | 'image' | 'qr_code'
    position: { x: number; y: number }
    fontSize: number
}

export type CertificateTemplateFormData = Pick<CertificateTemplateDomain, 'name' | 'description' | 'schemeId' | 'isDefault'>

// ── DTO Types ──

export interface CertificateFieldDTO {
    key: string
    label: string
    type: 'text' | 'date' | 'image' | 'qr_code'
    position: { x: number; y: number }
    font_size: number
}

export interface CertificateTemplateDTO {
    id: string
    name: string
    description: string
    scheme_id: string
    scheme_name: string
    thumbnail_url: string
    is_default: boolean
    fields: CertificateFieldDTO[]
    created_at: string
    updated_at: string
}

export interface CertificateTemplateListResponseDTO {
    data: CertificateTemplateDTO[]
    total: number
    page: number
    per_page: number
}
