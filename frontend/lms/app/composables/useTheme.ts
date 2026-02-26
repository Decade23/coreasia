type Theme = 'dark' | 'light'

const STORAGE_KEY = 'ca-theme'

const theme = ref<Theme>('dark')

function applyTheme(newTheme: Theme) {
  if (import.meta.server) return

  const html = document.documentElement

  html.classList.add('theme-transition')
  requestAnimationFrame(() => {
    if (newTheme === 'light') {
      html.classList.add('light')
    } else {
      html.classList.remove('light')
    }

    setTimeout(() => {
      html.classList.remove('theme-transition')
    }, 400)
  })

  localStorage.setItem(STORAGE_KEY, newTheme)
  theme.value = newTheme
}

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')
  const isLight = computed(() => theme.value === 'light')

  function toggle() {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function set(newTheme: Theme) {
    applyTheme(newTheme)
  }

  function init() {
    if (import.meta.server) return

    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    const preferred = stored ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

    theme.value = preferred

    if (preferred === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }

  return {
    theme: readonly(theme),
    isDark,
    isLight,
    toggle,
    set,
    init,
  }
}
