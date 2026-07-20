// Language configuration for internationalization
export const LOCALES = {
  id: {
    code: 'id',
    name: 'Indonesian',
    flag: 'ID',
  },
  en: {
    code: 'en',
    name: 'English',
    flag: 'EN',
  },
} as const

export interface Locale {
  code: string
  name: string
  flag: string
}

// Default locale
export const DEFAULT_LOCALE = 'id'

export const LOCALE_QUERY_KEY = 'lang'

export const isSupportedLocale = (value: unknown): value is keyof typeof LOCALES =>
  typeof value === 'string' && value in LOCALES

/**
 * SATU-SATUNYA penentu locale untuk rendering, dan ia HANYA membaca URL.
 *
 * Sengaja tidak melihat cookie: halaman marketing di-cache Vercel dengan cache key
 * dari path + query (`allowQuery: ['lang']`), bukan cookie. Kalau cookie ikut
 * menentukan hasil render, satu respons Bahasa Indonesia bisa tersimpan lalu
 * disajikan ke pengunjung ber-cookie 'en' — server mengirim ID, klien menghitung
 * EN, dan hidrasinya mismatch di setiap node ber-t(). Dengan URL sebagai satu-
 * satunya sumber, keluaran server deterministik per cache key.
 *
 * Preferensi cookie tetap dihormati, tapi lewat pengalihan sisi-klien setelah
 * hidrasi (plugins/locale-sticky.client.ts), bukan dengan mengubah hasil render.
 */
export const resolveLocaleFromQuery = (query: Record<string, unknown>): keyof typeof LOCALES => {
  const raw = Array.isArray(query[LOCALE_QUERY_KEY])
    ? (query[LOCALE_QUERY_KEY] as unknown[])[0]
    : query[LOCALE_QUERY_KEY]

  return isSupportedLocale(raw) ? raw : DEFAULT_LOCALE
}

// Helper to get locale info
export const getLocaleInfo = (locale: string) => {
  return LOCALES[locale as keyof typeof LOCALES] || LOCALES[DEFAULT_LOCALE]
}

// Helper to format date based on locale
export const formatDate = (date: Date, locale: string = DEFAULT_LOCALE): string => {
  if (locale === 'en') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Helper to format number based on locale
export const formatNumber = (num: number, locale: string = DEFAULT_LOCALE): string => {
  if (locale === 'en') {
    return num.toLocaleString('en-US')
  }

  return num.toLocaleString('id-ID')
}