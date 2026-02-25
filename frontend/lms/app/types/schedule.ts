// ── Domain Types (Clean UI Data) ──

export type ScheduleType = 'cbt_online' | 'lab_offline' | 'hybrid'
export type ScheduleStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'

export interface ScheduleAssessorDomain {
    id: string
    name: string
    initials: string
}

export interface ScheduleDomain {
    id: string
    title: string
    schemeId: string
    schemeName: string
    type: ScheduleType
    status: ScheduleStatus
    startDate: Date
    endDate: Date
    location: string
    maxParticipants: number
    currentParticipants: number
    assessors: ScheduleAssessorDomain[]
    createdAt: Date
    updatedAt: Date
}

export type ScheduleFormData = Pick<ScheduleDomain, 'title' | 'schemeId' | 'type' | 'location' | 'maxParticipants'> & {
    startDate: string
    endDate: string
    assessorIds: string[]
}

// ── DTO Types (API snake_case) ──

export interface ScheduleAssessorDTO {
    id: string
    name: string
    initials: string
}

export interface ScheduleDTO {
    id: string
    title: string
    scheme_id: string
    scheme_name: string
    schedule_type: ScheduleType
    status: ScheduleStatus
    start_date: string
    end_date: string
    location: string
    max_participants: number
    current_participants: number
    assessors: ScheduleAssessorDTO[]
    created_at: string
    updated_at: string
}

export interface ScheduleListResponseDTO {
    data: ScheduleDTO[]
    total: number
    page: number
    per_page: number
}
