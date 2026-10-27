export interface SavedBrief {
    success: boolean
    lead_id: string
    reference: string
    status: string
    replayed: boolean
}

export function submitContactBrief(base: string, payload: Record<string, unknown>) {
    return $fetch<SavedBrief>(`${base.replace(/\/+$/, '')}/public/leads`, {
        method: 'POST',
        body: payload,
        timeout: 15000,
        retry: 0,
    })
}
