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

// ──────────────────────────────────────
// Generated URLs
// ──────────────────────────────────────
export const LINKS = {
  whatsapp: `https://wa.me/${CONTACT.whatsapp}`,
  email: `mailto:${CONTACT.email}`,
  linkedin: 'https://www.linkedin.com/company/coreasia',
  instagram: 'https://www.instagram.com/coreasia',
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

// ──────────────────────────────────────
// Navigation Items (moved to navigation.ts for i18n support)
// ──────────────────────────────────────
// Note: NAV_ITEMS now imported from utils/navigation.ts

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

/** Build WhatsApp URL with pre-filled message */
export const buildWhatsAppUrl = (message?: string): string => {
  const base = LINKS.whatsapp
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/** Build mailto URL with optional subject and body */
export const buildMailtoUrl = (subject?: string, body?: string): string => {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const qs = params.toString()
  return qs ? `${LINKS.email}?${qs}` : LINKS.email
}
