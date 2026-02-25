// ── Domain Types ──

export type AuditAction = 'login' | 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'submit' | 'review'

export interface AuditLogDomain {
    id: string
    userId: string
    userName: string
    userRole: string
    action: AuditAction
    resource: string
    resourceId: string
    description: string
    ipAddress: string
    timestamp: Date
}

export interface QualityReviewDomain {
    id: string
    assesseeId: string
    assesseeName: string
    assessorId: string
    assessorName: string
    schemeId: string
    schemeName: string
    recommendation: 'competent' | 'not_competent'
    assessorNotes: string
    managerNotes: string
    status: 'pending_review' | 'approved' | 'rejected' | 'revision_needed'
    submittedAt: Date
    reviewedAt?: Date
}

export interface QualityStatsDomain {
    totalAssessments: number
    competentCount: number
    notCompetentCount: number
    passRate: number
    pendingReviews: number
    schemeBreakdown: {
        schemeName: string
        total: number
        competent: number
        passRate: number
    }[]
}

// ── DTO Types ──

export interface AuditLogDTO {
    id: string
    user_id: string
    user_name: string
    user_role: string
    action: AuditAction
    resource: string
    resource_id: string
    description: string
    ip_address: string
    timestamp: string
}

export interface QualityReviewDTO {
    id: string
    assessee_id: string
    assessee_name: string
    assessor_id: string
    assessor_name: string
    scheme_id: string
    scheme_name: string
    recommendation: 'competent' | 'not_competent'
    assessor_notes: string
    manager_notes: string
    status: 'pending_review' | 'approved' | 'rejected' | 'revision_needed'
    submitted_at: string
    reviewed_at?: string
}

export interface QualityStatsDTO {
    total_assessments: number
    competent_count: number
    not_competent_count: number
    pass_rate: number
    pending_reviews: number
    scheme_breakdown: {
        scheme_name: string
        total: number
        competent: number
        pass_rate: number
    }[]
}

export interface AuditLogListResponseDTO {
    data: AuditLogDTO[]
    total: number
    page: number
    per_page: number
}

export interface QualityReviewListResponseDTO {
    data: QualityReviewDTO[]
    total: number
    page: number
    per_page: number
}
