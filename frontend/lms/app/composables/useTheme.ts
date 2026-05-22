type Theme = 'dark' | 'light'

export function useTheme() {
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.value === 'dark')
  const isLight = computed(() => colorMode.value === 'light')

  function toggle() {
    const html = document.documentElement
    html.classList.add('theme-transition')
    
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'

    setTimeout(() => {
      html.classList.remove('theme-transition')
    }, 400)
  }

  function set(newTheme: Theme) {
    colorMode.preference = newTheme
  }

  function init() {
    // color-mode automatically handles initialization, but we keep this for backwards compatibility
  }

  return {
    theme: computed(() => colorMode.value as Theme),
    isDark,
    isLight,
    toggle,
    set,
    init,
  }
}
