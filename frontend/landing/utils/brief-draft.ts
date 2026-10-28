import type { PhoneRegion, ProjectBrief } from './contact-brief'

export const BRIEF_DRAFT_KEY = 'coreasia:brief-draft:v1'
export const BRIEF_DRAFT_TTL = 24 * 60 * 60 * 1000
export interface BriefDraft {
    form: ProjectBrief
    step: 1 | 2
    region: PhoneRegion
    requestId: string
    plan: string
}

export function encodeBriefDraft(draft: BriefDraft, now = Date.now()): string {
    return JSON.stringify({ version: 1, expires: now + BRIEF_DRAFT_TTL, ...draft })
}

export function decodeBriefDraft(raw: string | null, now = Date.now()): BriefDraft | null {
    if (!raw || raw.length > 24000) return null
    try {
        const d = JSON.parse(raw)
        if (d.version !== 1 || !Number.isFinite(d.expires) || d.expires <= now || d.expires > now + BRIEF_DRAFT_TTL) return null
        if (![1, 2].includes(d.step) || !['ID', 'international'].includes(d.region) || typeof d.plan !== 'string' || d.plan.length > 200) return null
        const f = d.form
        const lengths = { name: 200, email: 254, phone: 40, subject: 100, message: 5000, organization: 300, budgetRange: 100, timeline: 30 }
        if (!f || Object.entries(lengths).some(([key, max]) => typeof f[key] !== 'string' || f[key].length > max)) return null
        if (!['whatsapp', 'email'].includes(f.preferredContact) || typeof f.consent !== 'boolean') return null
        if (typeof d.requestId !== 'string' || (d.requestId && !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(d.requestId))) return null
        // Copy an explicit allowlist, not arbitrary properties from storage.
        return { form: Object.fromEntries([...Object.keys(lengths), 'preferredContact', 'consent'].map(k => [k, f[k]])) as unknown as ProjectBrief,
            step: d.step, region: d.region, requestId: d.requestId, plan: d.plan }
    } catch { return null }
}
