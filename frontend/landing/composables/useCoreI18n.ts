import { computed, watch } from 'vue'
import { DEFAULT_LOCALE, LOCALES, getLocaleInfo } from '~/utils/i18n'
import { getContent } from '~/utils/content'

export const LOCALE_QUERY_KEY = 'lang'

const isSupportedLocale = (value: unknown): value is keyof typeof LOCALES => {
  return typeof value === 'string' && value in LOCALES
}

export const useCoreI18n = () => {
  const route = useRoute()
  const localeCookie = useCookie<keyof typeof LOCALES>('coreasia-locale', {
    default: () => DEFAULT_LOCALE,
  })

  watch(
    () => route.query[LOCALE_QUERY_KEY],
    (value) => {
      const queryLocale = Array.isArray(value) ? value[0] : value
      if (isSupportedLocale(queryLocale)) {
        localeCookie.value = queryLocale
      }
    },
    { immediate: true },
  )

  const locale = computed<keyof typeof LOCALES>({
    get() {
      const rawQueryLocale = Array.isArray(route.query[LOCALE_QUERY_KEY])
        ? route.query[LOCALE_QUERY_KEY][0]
        : route.query[LOCALE_QUERY_KEY]

      if (isSupportedLocale(rawQueryLocale)) {
        return rawQueryLocale
      }

      return isSupportedLocale(localeCookie.value) ? localeCookie.value : DEFAULT_LOCALE
    },
    set(value) {
      localeCookie.value = isSupportedLocale(value) ? value : DEFAULT_LOCALE
    },
  })

  const setLocale = async (nextLocale: keyof typeof LOCALES) => {
    locale.value = nextLocale

    const nextQuery = { ...route.query }
    if (nextLocale === DEFAULT_LOCALE) {
      delete nextQuery[LOCALE_QUERY_KEY]
    } else {
      nextQuery[LOCALE_QUERY_KEY] = nextLocale
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
  const content = computed(() => getContent(locale.value))

  const t = (path: string) => {
    const localeContent = getContent(locale.value)
    const fallbackContent = getContent(DEFAULT_LOCALE)
    const pathParts = path.split('.')

    let result: any = localeContent
    for (const part of pathParts) {
      result = result?.[part]
    }

    if (result !== undefined) {
      return result
    }

    let fallbackResult: any = fallbackContent
    for (const part of pathParts) {
      fallbackResult = fallbackResult?.[part]
    }

    return fallbackResult
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
