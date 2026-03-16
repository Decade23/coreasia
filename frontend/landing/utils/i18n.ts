// Language configuration for internationalization
export const LOCALES = {
  id: {
    code: 'id',
    name: 'Indonesian',
    flag: '🇮🇩',
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