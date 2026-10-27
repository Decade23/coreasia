import { describe, expect, it } from 'vitest'
import {
    briefContact,
    briefWhatsAppMessage,
    normalizeWhatsApp,
    validateBriefStep,
    type ProjectBrief,
} from '~/utils/contact-brief'

const form = (): ProjectBrief => ({
    name: 'Pengunjung Contoh',
    email: '',
    phone: '0812 0000 0000',
    subject: 'webapp',
    budgetRange: 'not_set',
    timeline: 'planning',
    organization: 'Contoh',
    preferredContact: 'whatsapp',
    message: 'Aplikasi pemesanan untuk tim',
    consent: true,
})
describe('brief dua langkah', () => {
    it('menerima kontak WhatsApp tanpa membuat email palsu', () => {
        expect(validateBriefStep(form(), 2)).toBeUndefined()
        expect(briefContact(form())).toEqual({ email: '', phone: '+6281200000000' })
    })
    it('memvalidasi kontak yang dipilih dan tidak mengirim kontak tersembunyi', () => {
        const f = { ...form(), preferredContact: 'email' as const, email: '  CONTOH@example.test ' }
        expect(validateBriefStep(f, 2)).toBeUndefined()
        expect(briefContact(f)).toEqual({ email: 'contoh@example.test', phone: '' })
        expect(validateBriefStep({ ...f, email: '' }, 2)).toBe('email')
    })
    it('menolak nomor rusak, kebutuhan kosong, nama kosong dan consent kosong', () => {
        expect(validateBriefStep({ ...form(), phone: '++6281200000000' }, 2)).toBe('phone')
        expect(validateBriefStep({ ...form(), message: '  ' }, 1)).toBe('message')
        expect(validateBriefStep({ ...form(), name: '' }, 2)).toBe('name')
        expect(validateBriefStep({ ...form(), consent: false }, 2)).toBe('consent')
        expect(normalizeWhatsApp('+81 90 0000 0000')).toBe('+819000000000')
    })
    it('membawa referensi dan konteks ke WhatsApp tanpa mencampur kontak lama', () => {
        const result = briefWhatsAppMessage(
            { ...form(), email: 'hidden@example.test' },
            {
                intro: 'Halo',
                subject: 'Aplikasi web',
                reference: 'CA-EXAMPLE',
                budget: 'Ingin diskusi dulu',
                timeline: 'Masih merencanakan',
                plan: 'MVP',
            },
        )
        for (const expected of ['CA-EXAMPLE', 'Aplikasi web', 'Ingin diskusi dulu', 'Masih merencanakan', 'MVP'])
            expect(result).toContain(expected)
        expect(result).not.toContain('hidden@example.test')
    })
})
