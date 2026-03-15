import { computed, watch } from 'vue'

export const THEME_QUERY_KEY = 'theme'
export const DEFAULT_THEME = 'dark'
export const THEMES = ['dark', 'light'] as const

type CoreTheme = (typeof THEMES)[number]

const isSupportedTheme = (value: unknown): value is CoreTheme => {
  return typeof value === 'string' && THEMES.includes(value as CoreTheme)
}

export const useCoreTheme = () => {
  const route = useRoute()
  const themeCookie = useCookie<CoreTheme>('coreasia-theme', {
    default: () => DEFAULT_THEME,
  })

  watch(
    () => route.query[THEME_QUERY_KEY],
    (value) => {
      const queryTheme = Array.isArray(value) ? value[0] : value
      if (isSupportedTheme(queryTheme)) {
        themeCookie.value = queryTheme
      }
    },
    { immediate: true },
  )

  const theme = computed<CoreTheme>({
    get() {
      const rawQueryTheme = Array.isArray(route.query[THEME_QUERY_KEY])
        ? route.query[THEME_QUERY_KEY][0]
        : route.query[THEME_QUERY_KEY]

      if (isSupportedTheme(rawQueryTheme)) {
        return rawQueryTheme
      }

      return isSupportedTheme(themeCookie.value) ? themeCookie.value : DEFAULT_THEME
    },
    set(value) {
      themeCookie.value = isSupportedTheme(value) ? value : DEFAULT_THEME
    },
  })

  const setTheme = async (nextTheme: CoreTheme) => {
    theme.value = nextTheme

    const nextQuery = { ...route.query }
    if (nextTheme === DEFAULT_THEME) {
      delete nextQuery[THEME_QUERY_KEY]
    } else {
      nextQuery[THEME_QUERY_KEY] = nextTheme
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

  return {
    theme,
    setTheme,
    themes: THEMES,
  }
}
