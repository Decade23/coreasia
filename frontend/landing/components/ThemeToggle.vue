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

const currentLabel = computed(() =>
  isLightTheme.value
    ? (t('components.themeToggle.light') as string)
    : (t('components.themeToggle.dark') as string),
)

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
  <div class="inline-flex items-center gap-3">
    <button
      type="button"
      class="relative inline-flex h-11 w-20 items-center rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-toggle-track)] p-1 shadow-sm transition hover:border-[color:var(--ca-gold-border)] hover:bg-[var(--ca-panel-bg-strong)]"
      :aria-label="nextAriaLabel"
      :aria-pressed="isLightTheme"
      :disabled="isSwitching"
      @click="toggleTheme"
    >
      <span
        class="absolute left-1 top-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-toggle-thumb)] text-[var(--ca-text)] shadow-[var(--ca-toggle-thumb-shadow)] transition-transform duration-300"
        :class="isLightTheme ? 'translate-x-9' : 'translate-x-0'"
      >
        <Icon :name="isLightTheme ? options[1]?.icon : options[0]?.icon" class="h-4 w-4" />
      </span>

      <span class="flex w-full items-center justify-between px-2">
        <Icon
          :name="options[0]?.icon"
          class="h-4 w-4 transition"
          :class="isLightTheme ? 'text-[var(--ca-subtle)] opacity-55' : 'ca-tone-gold opacity-100'"
        />
        <Icon
          :name="options[1]?.icon"
          class="h-4 w-4 transition"
          :class="isLightTheme ? 'ca-tone-gold opacity-100' : 'text-[var(--ca-subtle)] opacity-55'"
        />
      </span>
    </button>

    <div class="hidden min-w-[4.5rem] text-left leading-none sm:block">
      <p class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
        {{ t('components.themeToggle.label') }}
      </p>
      <p class="mt-1 text-xs font-semibold text-[var(--ca-text)]">
        {{ currentLabel }}
      </p>
    </div>
  </div>
</template>
