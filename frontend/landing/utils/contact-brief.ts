export interface ProjectBrief {
    name: string
    email: string
    phone: string
    subject: string
    budgetRange: string
    timeline: string
    organization: string
    preferredContact: 'whatsapp' | 'email'
    message: string
    consent: boolean
}

export function normalizeWhatsApp(raw: string): string {
    const phone = raw.trim().replace(/[\s()-]/g, '')
    if (phone.startsWith('08')) return `+62${phone.slice(1)}`
    if (phone.startsWith('628')) return `+${phone}`
    if (phone.startsWith('8')) return `+62${phone}`
    return phone
}

export type PhoneRegion = 'ID' | 'international'

export function formatBriefPhone(raw: string, region: PhoneRegion = 'ID'): string {
    let phone = raw.replace(/[^0-9+]/g, '').replace(/(?!^)\+/g, '')
    if (!phone) return ''
    if (phone.startsWith('00')) phone = `+${phone.slice(2)}`
    if (region === 'ID') phone = phone.startsWith('0') ? `+62${phone.slice(1)}` : normalizeWhatsApp(phone)
    if (!phone.startsWith('+')) phone = `+${phone}`
    if (!phone.startsWith('+62')) return phone
    const digits = phone.slice(3)
    return ['+62', digits.slice(0, 3), digits.slice(3, 7), digits.slice(7)].filter(Boolean).join(' ')
}

/** Rapikan karakter yang sering terbawa saat paste, tanpa menebak alamat. */
export function normalizeBriefEmail(raw: string): string {
    return raw.replace(/\s/g, '').toLowerCase()
}

export function validateBriefStep(form: ProjectBrief, step: 1 | 2): string | undefined {
    if (step === 1) {
        if (!form.subject) return 'subject'
        if (!form.message.trim() || form.message.trim().length > 5000) return 'message'
        return
    }
    if (form.name.trim().length < 2 || form.name.trim().length > 200) return 'name'
    if ((form.preferredContact === 'email' || form.email.trim()) &&
        (form.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))) return 'email'
    if ((form.preferredContact === 'whatsapp' || form.phone.trim()) && !/^\+[1-9][0-9]{7,14}$/.test(normalizeWhatsApp(form.phone)))
        return 'phone'
    if (form.organization.length > 300) return 'organization'
    if (!form.consent) return 'consent'
}

export function briefContact(form: ProjectBrief) {
    return {
        email: form.email.trim().toLowerCase(),
        phone: normalizeWhatsApp(form.phone),
    }
}

// Hanya perubahan isi yang mengubah ID retry. Spasi tampilan nomor tidak dihitung.
export function briefFingerprint(form: ProjectBrief, plan: string): string {
    return JSON.stringify({ ...form, ...briefContact(form), name: form.name.trim(),
        message: form.message.trim(), organization: form.organization.trim(), plan })
}

export function briefWhatsAppMessage(
    form: ProjectBrief,
    labels: {
        intro: string
        subject: string
        budget: string
        timeline: string
        plan?: string
        reference?: string
        locale?: string
    },
): string {
    const words =
        labels.locale === 'en'
            ? { name: 'Name', company: 'Company', budget: 'Budget', start: 'Start', plan: 'Plan' }
            : { name: 'Nama', company: 'Usaha', budget: 'Anggaran', start: 'Mulai', plan: 'Paket' }
    return [
        labels.intro,
        labels.reference ? `Ref: ${labels.reference}` : '',
        labels.subject,
        `${words.name}: ${form.name.trim()}`,
        form.organization ? `${words.company}: ${form.organization.trim()}` : '',
        labels.budget ? `${words.budget}: ${labels.budget}` : '',
        labels.timeline ? `${words.start}: ${labels.timeline}` : '',
        labels.plan ? `${words.plan}: ${labels.plan}` : '',
        '',
        form.message.trim(),
    ]
        .filter(Boolean)
        .join('\n')
}
