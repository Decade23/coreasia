import type { AssessorProfileDTO, AssessorProfileDomain, AssessorFormData } from '~/types/assessor-profile'

export class AssessorProfileAdapter {

    public static toDomain(dto: AssessorProfileDTO): AssessorProfileDomain {
        return {
            id: dto.id,
            fullName: dto.full_name,
            email: dto.email,
            phoneNumber: dto.phone_number,
            specialization: dto.specialization,
            isActive: dto.is_active,
            license: dto.license ? {
                id: dto.license.id,
                licenseNumber: dto.license.license_number,
                issuedBy: dto.license.issued_by,
                issuedDate: new Date(dto.license.issued_date),
                expiryDate: new Date(dto.license.expiry_date),
                status: dto.license.status,
            } : null,
            assignedSchemes: (dto.assigned_schemes ?? []).map(s => ({
                schemeId: s.scheme_id,
                schemeName: s.scheme_name,
                schemeCode: s.scheme_code,
                assignedAt: new Date(s.assigned_at),
            })),
            totalAssessments: dto.total_assessments,
            completedAssessments: dto.completed_assessments,
            createdAt: new Date(dto.created_at),
            updatedAt: new Date(dto.updated_at),
        }
    }

    public static toDTO(form: AssessorFormData): Record<string, any> {
        return {
            full_name: form.fullName,
            email: form.email,
            phone_number: form.phoneNumber,
            specialization: form.specialization,
            is_active: form.isActive,
            license_number: form.licenseNumber,
            scheme_ids: form.schemeIds,
        }
    }
}
