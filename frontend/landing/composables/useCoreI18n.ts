import { computed, watch } from 'vue'
import { DEFAULT_LOCALE, LOCALES, getLocaleInfo } from '~/utils/i18n'
import { getContent } from '~/utils/content'

export const LOCALE_QUERY_KEY = 'lang'

const isSupportedLocale = (value: unknown): value is keyof typeof LOCALES => {
  return typeof value === 'string' && value in LOCALES
}

const resolvePathValue = (source: any, path: string) => {
  return path.split('.').reduce((result, part) => result?.[part], source)
}

const resolveLocaleFromRoute = (
  route: ReturnType<typeof useRoute>,
  fallback: keyof typeof LOCALES = DEFAULT_LOCALE,
): keyof typeof LOCALES => {
  const rawQueryLocale = Array.isArray(route.query[LOCALE_QUERY_KEY])
    ? route.query[LOCALE_QUERY_KEY][0]
    : route.query[LOCALE_QUERY_KEY]

  if (isSupportedLocale(rawQueryLocale)) {
    return rawQueryLocale
  }

  return fallback
}

export const useCoreI18n = () => {
  const route = useRoute()
  const localeCookie = useCookie<keyof typeof LOCALES>('coreasia-locale', {
    default: () => DEFAULT_LOCALE,
  })

  const resolveActiveLocale = () => {
    const cookieLocale = isSupportedLocale(localeCookie.value) ? localeCookie.value : DEFAULT_LOCALE
    return resolveLocaleFromRoute(route, cookieLocale)
  }

  const contentState = useState('coreasia-content', () => getContent(resolveActiveLocale()))

  watch(
    () => route.query[LOCALE_QUERY_KEY],
    (value) => {
      const queryLocale = Array.isArray(value) ? value[0] : value
      if (isSupportedLocale(queryLocale)) {
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