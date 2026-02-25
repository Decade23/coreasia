// ── Domain Types (Clean UI Data) ──

export type VerificationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_NEEDED' | 'VERIFIED' | 'REJECTED'

export interface VerificationDocumentDomain {
    id: string
    name: string
    type: string
    url: string
    fileSize: number
    uploadedAt: Date
}

export interface VerificationDomain {
    id: string
    assesseeName: string
    assesseeEmail: string
    schemeId: string
    schemeName: string
    status: VerificationStatus
    documents: VerificationDocumentDomain[]
    personalData: {
        fullName: string
        nik: string
        placeOfBirth: string
        dateOfBirth: string
        email: string
        phoneNumber: string
        address: string
    }
    reviewNotes: string
    reviewedBy?: string
    submittedAt: Date
    reviewedAt?: Date
    createdAt: Date
    updatedAt: Date
}

export interface VerificationActionPayload {
    action: 'approve' | 'reject' | 'request_revision'
    notes: string
}

// ── DTO Types (API snake_case) ──

export interface VerificationDocumentDTO {
    id: string
    name: string
    type: string
    url: string
    file_size: number
    uploaded_at: string
}

export interface VerificationDTO {
    id: string
    assessee_name: string
    assessee_email: string
    scheme_id: string
    scheme_name: string
    status: VerificationStatus
    documents: VerificationDocumentDTO[]
    personal_data: {
        full_name: string
        nik: string
        place_of_birth: string
        date_of_birth: string
        email: string
        phone_number: string
        address: string
    }
    review_notes: string
    reviewed_by?: string
    submitted_at: string
    reviewed_at?: string
    created_at: string
    updated_at: string
}

export interface VerificationListResponseDTO {
    data: VerificationDTO[]
    total: number
    page: number
    per_page: number
}

export interface VerificationSummaryDTO {
    total_queue: number
    needs_review: number
    awaiting_revision: number
    completed_this_month: number
}
