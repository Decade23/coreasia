import type { CertificateTemplateDTO, CertificateTemplateDomain } from '~/types/certificate'

export class CertificateTemplateAdapter {

    public static toDomain(dto: CertificateTemplateDTO): CertificateTemplateDomain {
        return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            schemeId: dto.scheme_id,
            schemeName: dto.scheme_name,
            thumbnailUrl: dto.thumbnail_url,
            isDefault: dto.is_default,
            fields: (dto.fields ?? []).map(f => ({
                key: f.key,
                label: f.label,
                type: f.type,
                position: f.position,
                fontSize: f.font_size,
            })),
            createdAt: new Date(dto.created_at),
            updatedAt: new Date(dto.updated_at),
        }
    }
}
