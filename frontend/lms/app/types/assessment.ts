export interface PerformanceCriteria {
    id: string
    text: string
    status: 'K' | 'BK' | null
    evidenceId?: string
}

export interface CompetencyElement {
    id: string
    title: string
    criteria: PerformanceCriteria[]
}

export interface CompetencyUnit {
    id: string
    code: string
    title: string
    elements: CompetencyElement[]
}

export interface AssessmentState {
    unitId: string
    claims: Record<string, { status: 'K' | 'BK' | null, evidenceId?: string }>
}

// MOCK Data has been moved to Nitro Server (server/api/assessment/units.get.ts)
