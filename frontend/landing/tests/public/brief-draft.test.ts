import { describe, expect, it } from 'vitest'
import { BRIEF_DRAFT_TTL, decodeBriefDraft, encodeBriefDraft, type BriefDraft } from '~/utils/brief-draft'
const now = 100000000
const draft: BriefDraft = {
    form: { name: 'Contoh', email: 'contoh@example.test', phone: '+65 8123 4567', subject: 'website', message: 'Kebutuhan contoh', budgetRange: '', timeline: 'planning', organization: '', preferredContact: 'email', consent: true },
    step: 2, region: 'international', requestId: '11111111-1111-4111-8111-111111111111', plan: 'MVP',
}
describe('draf brief satu tab', () => {
    it('memulihkan langkah, data, konteks dan ID retry yang sama setelah navigasi/reload', () => {
        expect(decodeBriefDraft(encodeBriefDraft(draft, now), now + 1000)).toEqual(draft)
    })
    it('membuang draf kedaluwarsa, rusak atau terlalu besar', () => {
        expect(decodeBriefDraft(encodeBriefDraft(draft, now), now + BRIEF_DRAFT_TTL)).toBeNull()
        expect(decodeBriefDraft('{rusak', now)).toBeNull()
        expect(decodeBriefDraft(null, now)).toBeNull()
        expect(decodeBriefDraft('x'.repeat(24001), now)).toBeNull()
        expect(decodeBriefDraft(encodeBriefDraft({ ...draft, requestId: 'rusak' }, now), now)).toBeNull()
    })
    it('menolak tipe salah dan tidak memulihkan atribut liar dari storage', () => {
        const raw = JSON.parse(encodeBriefDraft(draft, now))
        raw.form.extra = 'jangan ikut'
        expect(decodeBriefDraft(JSON.stringify(raw), now)?.form).not.toHaveProperty('extra')
        raw.form.consent = 'true'
        expect(decodeBriefDraft(JSON.stringify(raw), now)).toBeNull()
    })
})
