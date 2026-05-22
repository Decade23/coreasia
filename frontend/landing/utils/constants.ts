/**
 * CoreAsia - Centralized Constants
 * Single source of truth untuk semua contact info, social links, dan konfigurasi bisnis.
 */

// ──────────────────────────────────────
// Contact Information
// ──────────────────────────────────────
export const CONTACT = {
    /** WhatsApp number in international format (tanpa +) */
    whatsapp: '6285693380123',
    /** Display format untuk UI */
    whatsappDisplay: '+62 856-9338-0123',
    /** Primary email */
    email: 'hello@coreasia.id',
    /** Office location */
    location: 'Jakarta, Indonesia',
    /** Jam kerja */
    businessHours: 'Senin - Jumat, 09.00 - 17.00 WIB',
} as const

const WHATSAPP_BASE_URL = `https://wa.me/${CONTACT.whatsapp}`
const WHATSAPP_DEFAULT_MESSAGE = 'Halo CoreAsia, saya ingin mengetahui lebih lanjut tentang produk dan layanan Anda.'

// ──────────────────────────────────────
// Generated URLs
// ──────────────────────────────────────
export const LINKS = {
    whatsapp: `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`,
    email: `mailto:${CONTACT.email}`,
    linkedin: '',
    instagram: 'https://www.instagram.com/coreasia.id/',
} as const

// ──────────────────────────────────────
// Company Info
// ──────────────────────────────────────
export const COMPANY = {
    name: 'CoreAsia Teknologi',
    shortName: 'CoreAsia',
    tagline: 'Strategic Technology Partner',
    domain: 'coreasia.id',
    url: 'https://coreasia.id',
    description:
        'Ekosistem produk digital dan mitra teknologi strategis untuk sertifikasi, monitoring web, CRM, dan model pertumbuhan berbasis SaaS maupun venture.',
} as const

export const BRAND_ASSETS = {
    logo: '/logos/logo-512.png',
    logoWebp: '/logos/logo-512.webp',
    favicon: '/favicons/favicon-48.png',
    socialImage: '/social/og-image.webp',
    twitterImage: '/social/twitter-card.webp',
} as const

export const STRUCTURED_SAME_AS = [LINKS.instagram] as const

export const PRIMARY_SITE_LINKS = [
    { name: 'Produk CoreAsia', path: '/products' },
    { name: 'Layanan Website', path: '/layanan/jasa-pembuatan-website' },
    { name: 'Pantau', path: '/products/pantau' },
    { name: 'LeadKu', path: '/products/leadku' },
    { name: 'Harga', path: '/pricing' },
    { name: 'Artikel', path: '/artikel' },
    { name: 'Tentang CoreAsia', path: '/about' },
    { name: 'Kontak', path: '/contact' },
    { name: 'FAQ', path: '/faq' },
] as const

// ──────────────────────────────────────
// Navigation Items (moved to navigation.ts for i18n support)
// ──────────────────────────────────────
// Note: NAV_ITEMS now imported from utils/navigation.ts

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

/** Build WhatsApp URL with pre-filled message */
export const buildWhatsAppUrl = (message?: string): string => {
    const cleanMessage = message?.trim()
    return cleanMessage ? `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(cleanMessage)}` : LINKS.whatsapp
}

/** Build mailto URL with optional subject and body */
export const buildMailtoUrl = (subject?: string, body?: string): string => {
    const params = new URLSearchParams()
    if (subject) params.set('subject', subject)
    if (body) params.set('body', body)
    const qs = params.toString()
    return qs ? `${LINKS.email}?${qs}` : LINKS.email
}
