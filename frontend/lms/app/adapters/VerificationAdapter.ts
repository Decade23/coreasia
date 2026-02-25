import type { VerificationDTO, VerificationDomain, VerificationDocumentDTO, VerificationDocumentDomain } from '~/types/verification'

export class VerificationAdapter {

    public static toDocumentDomain(dto: VerificationDocumentDTO): VerificationDocumentDomain {
        return {
            id: dto.id,
            name: dto.name,
            type: dto.type,
            url: dto.url,
            fileSize: dto.file_size,
            uploadedAt: new Date(dto.uploaded_at),
        }
    }

    public static toDomain(dto: VerificationDTO): VerificationDomain {
        return {
            id: dto.id,
            assesseeName: dto.assessee_name,
            assesseeEmail: dto.assessee_email,
            schemeId: dto.scheme_id,
            schemeName: dto.scheme_name,
            status: dto.status,
            documents: dto.documents ? dto.documents.map(this.toDocumentDomain) : [],
            personalData: {
                fullName: dto.personal_data.full_name,
                nik: dto.personal_data.nik,
                placeOfBirth: dto.personal_data.place_of_birth,
                dateOfBirth: dto.personal_data.date_of_birth,
                email: dto.personal_data.email,
                phoneNumber: dto.personal_data.phone_number,
                address: dto.personal_data.address,
            },
            reviewNotes: dto.review_notes,
            reviewedBy: dto.reviewed_by,
            submittedAt: new Date(dto.submitted_at),
            reviewedAt: dto.reviewed_at ? new Date(dto.reviewed_at) : undefined,
            createdAt: new Date(dto.created_at),
            updatedAt: new Date(dto.updated_at),
        }
    }
}
