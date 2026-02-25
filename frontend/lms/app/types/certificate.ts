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

// ── Issued Certificate Types ──

export interface IssuedCertificateDomain {
    id: string
    certificateNumber: string
    holderName: string
    holderPhotoUrl: string
    schemeName: string
    schemeCode: string
    assessorName: string
    lspName: string
    status: CertificateStatus
    issuedDate: Date
    expiryDate: Date
    downloadUrl: string
    verificationUrl: string
    qrCodeData: string
}

export interface IssuedCertificateDTO {
    id: string
    certificate_number: string
    holder_name: string
    holder_photo_url: string
    scheme_name: string
    scheme_code: string
    assessor_name: string
    lsp_name: string
    status: CertificateStatus
    issued_date: string
    expiry_date: string
    download_url: string
    verification_url: string
    qr_code_data: string
}

export interface IssuedCertificateListResponseDTO {
    data: IssuedCertificateDTO[]
    total: number
    page: number
    per_page: number
}

// ── Public Verification Types ──

export interface PublicVerificationResultDomain {
    valid: boolean
    certificateNumber: string
    holderName: string
    holderPhotoUrl: string
    schemeName: string
    lspName: string
    status: CertificateStatus
    issuedDate: Date
    expiryDate: Date
}

export interface PublicVerificationResultDTO {
    valid: boolean
    certificate_number: string
    holder_name: string
    holder_photo_url: string
    scheme_name: string
    lsp_name: string
    status: CertificateStatus
    issued_date: string
    expiry_date: string
}
