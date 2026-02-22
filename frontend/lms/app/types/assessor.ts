export interface Applicant {
    id: string
    name: string
    nik: string
    schemeName: string
    status: 'pending' | 'reviewed' | 'completed'
    submittedAt: string
}

export interface ReviewClaim {
    kukId: string
    asesiClaim: 'K' | 'BK'
    assessorDecision: 'K' | 'BK' | null
    evidenceUrl?: string
}

export const MOCK_APPLICANTS: Applicant[] = [
    {
        id: 'APP-001',
        name: 'Budi Santoso',
        nik: '1234567890123456',
        schemeName: 'Junior Web Developer',
        status: 'pending',
        submittedAt: '2026-02-21T08:00:00Z'
    },
    {
        id: 'APP-002',
        name: 'Siti Aminah',
        nik: '3210987654321098',
        schemeName: 'Digital Marketing Specialist',
        status: 'pending',
        submittedAt: '2026-02-22T09:30:00Z'
    }
]
