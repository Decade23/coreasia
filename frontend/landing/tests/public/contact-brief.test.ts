import { describe, expect, it } from 'vitest'
import {
    briefContact,
    briefWhatsAppMessage,
    normalizeWhatsApp,
    formatBriefPhone,
    normalizeBriefEmail,
    briefFingerprint,
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
    it('mengirim kedua kontak yang terlihat dan tetap mewajibkan kanal pilihan', () => {
        const f = { ...form(), preferredContact: 'email' as const, email: '  CONTOH@example.test ' }
        expect(validateBriefStep(f, 2)).toBeUndefined()
        expect(briefContact(f)).toEqual({ email: 'contoh@example.test', phone: '+6281200000000' })
        expect(validateBriefStep({ ...f, email: '' }, 2)).toBe('email')
        expect(validateBriefStep({ ...f, phone: '' }, 2)).toBeUndefined()
        expect(validateBriefStep({ ...form(), email: 'rusak' }, 2)).toBe('email')
        expect(validateBriefStep({ ...f, phone: '123' }, 2)).toBe('phone')
    })
    it('memformat ketikan Indonesia bertahap dan paste kode internasional', () => {
        let display = ''
        for (const digit of '081234567890') display = formatBriefPhone(display + digit)
        expect(display).toBe('+62 812 3456 7890')
        expect(formatBriefPhone('6281234567890')).toBe(display)
        expect(formatBriefPhone('+65 (8123)-4567', 'international')).toBe('+6581234567')
        expect(formatBriefPhone('006581234567', 'international')).toBe('+6581234567')
        expect(formatBriefPhone('')).toBe('')
        expect(formatBriefPhone('+628123456789012345')).toContain('9012345') // do not silently truncate
    })
    it('merapikan email tanpa mengganti nama penyedia dan mempertahankan id retry untuk perubahan tampilan', () => {
        expect(normalizeBriefEmail('  Nama .Tim@EXAMPLE.TEST \n')).toBe('nama.tim@example.test')
        expect(normalizeBriefEmail('nama@gmial.com')).toBe('nama@gmial.com')
        expect(briefFingerprint(form(), '')).toBe(briefFingerprint({ ...form(), phone: '+62 812 0000 0000', name: ' Pengunjung Contoh ' }, ''))
        expect(briefFingerprint(form(), '')).not.toBe(briefFingerprint({ ...form(), message: 'Kebutuhan berbeda' }, ''))
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
