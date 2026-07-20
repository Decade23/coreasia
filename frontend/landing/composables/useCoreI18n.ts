import { computed, watch } from 'vue'
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

  const contentState = useState('coreasia-content', () => getContent(resolveActiveLocale()))

  watch(
    () => route.query[LOCALE_QUERY_KEY],
    (value) => {
      const queryLocale = Array.isArray(value) ? value[0] : value
      // Hanya di klien: menulis cookie saat SSR akan menempelkan header Set-Cookie
      // pada respons yang di-cache, sehingga preferensi satu pengunjung ikut
      // dipaksakan ke semua orang yang menerima salinan cache itu.
      if (import.meta.client && isSupportedLocale(queryLocale)) {
        localeCookie.value = queryLocale
      }

      contentState.value = getContent(resolveActiveLocale())
    },
    { immediate: true },
  )

  const locale = computed<keyof typeof LOCALES>({
    get() {
      return resolveActiveLocale()
    },
    set(value) {
      const nextLocale = isSupportedLocale(value) ? value : DEFAULT_LOCALE
      localeCookie.value = nextLocale
      contentState.value = getContent(nextLocale)
    },
  })

  const setLocale = async (nextLocale: keyof typeof LOCALES) => {
    const resolvedLocale = isSupportedLocale(nextLocale) ? nextLocale : DEFAULT_LOCALE

    locale.value = resolvedLocale

    const nextQuery = { ...route.query }
    if (resolvedLocale === DEFAULT_LOCALE) {
      delete nextQuery[LOCALE_QUERY_KEY]
    } else {
      nextQuery[LOCALE_QUERY_KEY] = resolvedLocale
    }

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
  const content = computed(() => contentState.value || getContent(locale.value))

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