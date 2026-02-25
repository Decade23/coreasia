import type { ScheduleDTO, ScheduleDomain, ScheduleFormData } from '~/types/schedule'

export class ScheduleAdapter {

    public static toDomain(dto: ScheduleDTO): ScheduleDomain {
        return {
            id: dto.id,
            title: dto.title,
            schemeId: dto.scheme_id,
            schemeName: dto.scheme_name,
            type: dto.schedule_type,
            status: dto.status,
            startDate: new Date(dto.start_date),
            endDate: new Date(dto.end_date),
            location: dto.location,
            maxParticipants: dto.max_participants,
            currentParticipants: dto.current_participants,
            assessors: dto.assessors ?? [],
            createdAt: new Date(dto.created_at),
            updatedAt: new Date(dto.updated_at),
        }
    }

    public static toDTO(form: ScheduleFormData): Record<string, any> {
        return {
            title: form.title,
            scheme_id: form.schemeId,
            schedule_type: form.type,
            start_date: form.startDate,
            end_date: form.endDate,
            location: form.location,
            max_participants: form.maxParticipants,
            assessor_ids: form.assessorIds,
        }
    }
}
