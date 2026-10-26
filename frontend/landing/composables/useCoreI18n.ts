import { computed } from 'vue'
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_QUERY_KEY,
  getLocaleInfo,
  isSupportedLocale,
  resolveLocaleFromQuery,
} from '~/utils/i18n'
import { getContent } from '~/utils/content'

export { LOCALE_QUERY_KEY }

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Translation paths can return text, lists, or nested objects.
const resolvePathValue = (source: any, path: string) => {
  return path.split('.').reduce((result, part) => result?.[part], source)
}

export const useCoreI18n = () => {
  const route = useRoute()
  // TANPA opsi `default`: default membuat Nuxt menuliskan cookie saat SSR ketika
  // pengunjung belum punya, dan header Set-Cookie itu ikut tersimpan di cache lalu
  // dipaksakan ke semua orang — menimpa preferensi bahasa mereka dengan 'id'.
  // Cookie kini hanya lahir dari pilihan eksplisit pengguna.
  const localeCookie = useCookie<keyof typeof LOCALES | undefined>('coreasia-locale')

  // Cookie sengaja TIDAK ikut menentukan hasil render — lihat resolveLocaleFromQuery.
  // Ia hanya dicatat saat pengguna memilih bahasa, lalu dipakai plugin sticky di
  // sisi klien untuk mengarahkan ke URL ber-?lang.
  const resolveActiveLocale = () => resolveLocaleFromQuery(route.query)

  const locale = computed<keyof typeof LOCALES>({
    get() {
      return resolveActiveLocale()
    },
    set(value) {
      const nextLocale = isSupportedLocale(value) ? value : DEFAULT_LOCALE
      localeCookie.value = nextLocale
    },
  })

  const setLocale = async (nextLocale: keyof typeof LOCALES) => {
    const resolvedLocale = isSupportedLocale(nextLocale) ? nextLocale : DEFAULT_LOCALE

    locale.value = resolvedLocale

    const { [LOCALE_QUERY_KEY]: _previousLocale, ...withoutLocale } = route.query
    const nextQuery = resolvedLocale === DEFAULT_LOCALE ? withoutLocale : { ...withoutLocale, [LOCALE_QUERY_KEY]: resolvedLocale }

    await navigateTo(
      {
        path: route.path,
        query: nextQuery,
        hash: route.hash,
      },
      { replace: true },
    )
  }

  const currentLocaleInfo = computed(() => getLocaleInfo(locale.value))
  const availableLocales = computed(() => Object.values(LOCALES))
  // Dictionaries are already bundled on both server and client. Keeping them in
  // useState serializes the whole dictionary into every HTML payload a second time.
  const content = computed(() => getContent(locale.value))

  const t = (path: string) => {
    const localizedValue = resolvePathValue(content.value, path)
    if (localizedValue !== undefined) {
      return localizedValue
    }

    return resolvePathValue(getContent(DEFAULT_LOCALE), path)
  }

  return {
    locale,
    localeInfo: currentLocaleInfo,
    availableLocales,
    content,
    setLocale,
    t,
  }
}