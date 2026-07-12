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
    legalName: 'PT Inti Asia Teknologi',
    shortName: 'CoreAsia',
    tagline: 'Strategic Technology Partner',
    domain: 'coreasia.id',
    url: 'https://coreasia.id',
    description:
        'Ekosistem produk digital dan mitra teknologi strategis untuk sertifikasi, monitoring web, CRM, dan model pertumbuhan berbasis SaaS maupun venture.',
} as const

// Merchant of Record (penjual sah) untuk pembelian CoreAsia Download Manager.
// Sumber-tunggal — dirujuk via token {mor}/{morStatement} di konten legal
// (privacy/terms/refund). Ganti penyedia? cukup ubah di sini.
export const MERCHANT = {
    name: 'Gumroad',
    // Cara tagihan ini muncul di rekening pembeli (untuk mengenali charge).
    // TODO(owner): verifikasi descriptor Gumroad sebenarnya pada statement nyata.
    statement: 'GUMROAD.COM',
    // Halaman checkout produk (Gumroad custom domain). App desktop pakai URL yang sama (BUY_URL).
    buyUrl: 'https://getcadm.coreasia.id',
} as const

// Merchant of Record (penjual sah) untuk pembelian CoreAsia Mounter.
// Checkout Gumroad — harga IDR muncul otomatis saat checkout.
export const MOUNTER = {
    buyUrl: 'https://coreasia.gumroad.com/l/mounter?utm_source=coreasia.id&utm_medium=landing&utm_campaign=mounter-launch',
    supportEmail: 'mailto:support@coreasia.id',
} as const

// ──────────────────────────────────────
// FastSpring (Merchant of Record) — popup checkout (SBL)
// ──────────────────────────────────────
export const FASTSPRING = {
    sbl: 'https://sbl.onfastspring.com/sbl/1.0.7/fastspring-builder.min.js',
    // TEST storefront; ganti ke 'coreasia.onfastspring.com/popup-coreasia' saat Live Mode aktif
    storefront: 'coreasia.test.onfastspring.com/popup-coreasia',
    productPath: 'coreasia-download-manager',
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
