<script setup lang="ts">
import { useCoreI18n } from '~/composables/useCoreI18n'
import { useCoreTheme } from '~/composables/useCoreTheme'

type ThemeOption = {
  value: 'dark' | 'light'
  icon: string
  label: string
  ariaLabel: string
}

const { t } = useCoreI18n()
const { theme, setTheme } = useCoreTheme()
const isSwitching = ref(false)

const options = computed<ThemeOption[]>(() => [
  {
    value: 'dark',
    icon: 'lucide:moon-star',
    label: t('components.themeToggle.dark') as string,
    ariaLabel: t('components.themeToggle.switchToDark') as string,
  },
  {
    value: 'light',
    icon: 'lucide:sun-medium',
    label: t('components.themeToggle.light') as string,
    ariaLabel: t('components.themeToggle.switchToLight') as string,
  },
])

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
</script>

<template>
  <div
    class="inline-flex items-center gap-1 rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-1 shadow-sm"
    :aria-label="t('components.themeToggle.label')"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="inline-flex min-w-[2.5rem] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition"
      :class="
        theme === option.value
          ? 'bg-[var(--ca-kicker-bg)] text-[var(--ca-text)]'
          : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]'
      "
      :aria-label="option.ariaLabel"
      :aria-pressed="theme === option.value"
      :disabled="isSwitching"
      @click="applyTheme(option.value)"
    >
      <Icon :name="option.icon" class="h-4 w-4" />
      <span class="hidden sm:inline">{{ option.label }}</span>
    </button>
  </div>
</template>
