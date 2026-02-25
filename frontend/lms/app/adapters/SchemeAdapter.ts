import type { SchemeDTO, SchemeDomain, UnitCompetencyDTO, UnitCompetencyDomain, SchemeFormData } from '~/types/scheme'

export class SchemeAdapter {

    public static toUnitDomain(dto: UnitCompetencyDTO): UnitCompetencyDomain {
        return {
            id: dto.id,
            code: dto.code,
            title: dto.title,
            elementCount: dto.element_count,
        }
    }

    public static toDomain(dto: SchemeDTO): SchemeDomain {
        return {
            id: dto.id,
            code: dto.code,
            name: dto.name,
            description: dto.description,
            isActive: dto.is_active,
            validityYears: dto.validity_years,
            units: dto.units ? dto.units.map(this.toUnitDomain) : [],
            unitCount: dto.unit_count,
            assesseeCount: dto.assessee_count,
            createdAt: new Date(dto.created_at),
            updatedAt: new Date(dto.updated_at),
        }
    }

    public static toDTO(form: SchemeFormData): Record<string, any> {
        return {
            code: form.code,
            name: form.name,
            description: form.description,
            is_active: form.isActive,
            validity_years: form.validityYears,
            unit_ids: form.unitIds,
        }
    }
}
