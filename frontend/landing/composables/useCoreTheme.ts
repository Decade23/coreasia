import { computed, onMounted, type Ref } from 'vue'

export const THEME_COOKIE_KEY = 'coreasia-theme'
export const DEFAULT_THEME = 'dark'
export const THEMES = ['dark', 'light'] as const
export const SYSTEM_THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

type CoreTheme = (typeof THEMES)[number]

const isSupportedTheme = (value: unknown): value is CoreTheme => {
  return typeof value === 'string' && THEMES.includes(value as CoreTheme)
}

const getSystemTheme = (): CoreTheme => {
  return window.matchMedia(SYSTEM_THEME_MEDIA_QUERY).matches ? 'dark' : 'light'
}

let hasAttachedSystemThemeListener = false

const syncSystemTheme = (systemTheme: Ref<CoreTheme | null>) => {
  if (!import.meta.client) {
    return
  }

  systemTheme.value = getSystemTheme()

  if (hasAttachedSystemThemeListener) {
    return
  }

  const mediaQuery = window.matchMedia(SYSTEM_THEME_MEDIA_QUERY)
  const handleChange = (event: MediaQueryListEvent) => {
    systemTheme.value = event.matches ? 'dark' : 'light'
  }

  mediaQuery.addEventListener('change', handleChange)
  hasAttachedSystemThemeListener = true
}

export const useCoreTheme = () => {
  const themeCookie = useCookie<CoreTheme | null>(THEME_COOKIE_KEY, {
    default: () => null,
  })
  const systemTheme = useState<CoreTheme | null>('coreasia-system-theme', () => null)

  onMounted(() => {
    syncSystemTheme(systemTheme)
  })

  const theme = computed<CoreTheme>({
    get() {
      if (isSupportedTheme(themeCookie.value)) {
        return themeCookie.value
      }

      if (isSupportedTheme(systemTheme.value)) {
        return systemTheme.value
      }

      return DEFAULT_THEME
    },
    set(value) {
      themeCookie.value = isSupportedTheme(value) ? value : null
    },
  })

  const setTheme = (nextTheme: CoreTheme) => {
    theme.value = nextTheme
  }

  return {
    theme,
    setTheme,
    systemTheme,
    themes: THEMES,
  }
}
