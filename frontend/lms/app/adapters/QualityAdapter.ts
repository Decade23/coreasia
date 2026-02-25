import type { AuditLogDTO, AuditLogDomain, QualityReviewDTO, QualityReviewDomain, QualityStatsDTO, QualityStatsDomain } from '~/types/quality'

export class QualityAdapter {

    public static toAuditLogDomain(dto: AuditLogDTO): AuditLogDomain {
        return {
            id: dto.id,
            userId: dto.user_id,
            userName: dto.user_name,
            userRole: dto.user_role,
            action: dto.action,
            resource: dto.resource,
            resourceId: dto.resource_id,
            description: dto.description,
            ipAddress: dto.ip_address,
            timestamp: new Date(dto.timestamp),
        }
    }

    public static toReviewDomain(dto: QualityReviewDTO): QualityReviewDomain {
        return {
            id: dto.id,
            assesseeId: dto.assessee_id,
            assesseeName: dto.assessee_name,
            assessorId: dto.assessor_id,
            assessorName: dto.assessor_name,
            schemeId: dto.scheme_id,
            schemeName: dto.scheme_name,
            recommendation: dto.recommendation,
            assessorNotes: dto.assessor_notes,
            managerNotes: dto.manager_notes,
            status: dto.status,
            submittedAt: new Date(dto.submitted_at),
            reviewedAt: dto.reviewed_at ? new Date(dto.reviewed_at) : undefined,
        }
    }

    public static toStatsDomain(dto: QualityStatsDTO): QualityStatsDomain {
        return {
            totalAssessments: dto.total_assessments,
            competentCount: dto.competent_count,
            notCompetentCount: dto.not_competent_count,
            passRate: dto.pass_rate,
            pendingReviews: dto.pending_reviews,
            schemeBreakdown: dto.scheme_breakdown.map(s => ({
                schemeName: s.scheme_name,
                total: s.total,
                competent: s.competent,
                passRate: s.pass_rate,
            })),
        }
    }
}
