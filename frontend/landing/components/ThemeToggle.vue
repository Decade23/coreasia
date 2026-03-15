<script setup lang="ts">
import { useCoreI18n } from '~/composables/useCoreI18n'
import { useCoreTheme } from '~/composables/useCoreTheme'

type ThemeOption = {
  value: 'dark' | 'light'
  icon: string
}

const { t } = useCoreI18n()
const { theme, setTheme } = useCoreTheme()
const isSwitching = ref(false)
const isLightTheme = computed(() => theme.value === 'light')

const options = computed<ThemeOption[]>(() => [
  {
    value: 'dark',
    icon: 'lucide:moon-star',
  },
  {
    value: 'light',
    icon: 'lucide:sun-medium',
  },
])

const nextAriaLabel = computed(() =>
  isLightTheme.value
    ? (t('components.themeToggle.switchToDark') as string)
    : (t('components.themeToggle.switchToLight') as string),
)

const applyTheme = async (nextTheme: 'dark' | 'light') => {
  if (isSwitching.value || theme.value === nextTheme) {
    return
  }

  isSwitching.value = true

  try {
    await setTheme(nextTheme)
  } finally {
    isSwitching.value = false
  }
}

const toggleTheme = () => {
  void applyTheme(isLightTheme.value ? 'dark' : 'light')
}
</script>

<template>
  <button
    type="button"
    class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-toggle-track)] text-[var(--ca-text)] shadow-[var(--ca-toggle-thumb-shadow)] transition hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)] hover:bg-[var(--ca-panel-bg-strong)] disabled:cursor-not-allowed disabled:opacity-60"
    :aria-label="nextAriaLabel"
    :aria-pressed="isLightTheme"
    :disabled="isSwitching"
    @click="toggleTheme"
  >
    <Icon
      :name="isLightTheme ? options[1]?.icon : options[0]?.icon"
      class="h-4.5 w-4.5"
      :class="isLightTheme ? 'ca-tone-gold' : 'text-[var(--ca-text)]'"
    />
  </button>
</template>
