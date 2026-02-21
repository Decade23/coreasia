// Language switching composable
import { ref, computed, watchEffect } from 'vue'
import { DEFAULT_LOCALE, LOCALES, getLocaleInfo } from '~/utils/i18n'
import { getContent } from '~/utils/content'

// Get locale from URL path or localStorage
const getLocaleFromPath = (): string => {
  if (typeof window !== 'undefined') {
    // Check URL path for locale prefix
    const path = window.location.pathname
    const localeFromPath = path.match(/^\/([a-z]{2})\//)?.[1]
    
    if (localeFromPath && LOCALES[localeFromPath as keyof typeof LOCALES]) {
      return localeFromPath
    }
    
    // Fall back to localStorage
    return localStorage.getItem('coreasia-locale') || DEFAULT_LOCALE
  }
  
  return DEFAULT_LOCALE
}

// Create reactive locale state
const locale = ref<string>(getLocaleFromPath())

// Update locale in localStorage and URL
const setLocale = (newLocale: string) => {
  if (!LOCALES[newLocale as keyof typeof LOCALES]) {
    console.warn(`Unsupported locale: ${newLocale}`)
    return
  }
  
  locale.value = newLocale
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('coreasia-locale', newLocale)
    
    // Update URL if needed
    const currentPath = window.location.pathname
    const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}\//, '/')
    
    if (newLocale === DEFAULT_LOCALE) {
      // Remove locale from URL
      if (currentPath !== pathWithoutLocale) {
        window.history.replaceState({}, '', pathWithoutLocale)
      }
    } else {
      // Add locale to URL
      const newPath = `/${newLocale}${pathWithoutLocale}`
      if (currentPath !== newPath) {
        window.history.replaceState({}, '', newPath)
      }
    }
  }
}

// Composable for internationalization
export const useCoreI18n = () => {
  const currentLocale = computed(() => locale.value)
  const currentLocaleInfo = computed(() => getLocaleInfo(locale.value))
  const availableLocales = computed(() => Object.values(LOCALES))
  const content = computed(() => getContent(locale.value))

  // Translation function - must be defined here to capture locale reactively
  const t = (path: string) => {
    const contentData = getContent(locale.value)
    const pathParts = path.split('.')
    let result: any = contentData

    for (const part of pathParts) {
      result = result?.[part]
    }

    return result
  }

  return {
    locale: currentLocale,
    localeInfo: currentLocaleInfo,
    availableLocales,
    content,
    setLocale,
    t,
  }
}

// Initialize locale listener (singleton)
if (typeof window !== 'undefined') {
  // Watch for URL changes to update locale
  window.addEventListener('popstate', () => {
    const newLocale = getLocaleFromPath()
    if (newLocale !== locale.value) {
      locale.value = newLocale
    }
  })
}