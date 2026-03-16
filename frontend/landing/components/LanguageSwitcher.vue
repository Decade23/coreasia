<script setup lang="ts">
import { LOCALES, type Locale } from '~/utils/i18n'
import { useCoreI18n } from '~/composables/useCoreI18n'
import { onClickOutside } from '@vueuse/core'

const { locale, availableLocales, setLocale } = useCoreI18n()

const isOpen = ref(false)
const container = ref<HTMLElement | null>(null)

onClickOutside(container, () => { isOpen.value = false })

const selectLanguage = (newLocale: string) => {
  setLocale(newLocale)
  isOpen.value = false
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

const currentLocale = computed(() =>
  (availableLocales as Locale[]).find((l: Locale) => l.code === locale.value)
)
</script>

<template>
  <div ref="container" class="relative">
    <button
      type="button"
      class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-toggle-track)] text-[var(--ca-text)] shadow-[var(--ca-toggle-thumb-shadow)] transition hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)] hover:bg-[var(--ca-panel-bg-strong)]"
      :aria-expanded="isOpen"
      aria-label="Select language"
      @click="isOpen = !isOpen"
    >
      <span class="text-base leading-none">{{ currentLocale?.flag }}</span>
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="ca-field-dropdown absolute right-0 top-full z-50 mt-2 w-44 rounded-xl py-1 shadow-2xl"
      >
        <button
          v-for="lang in availableLocales"
          :key="lang.code"
          type="button"
          class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors"
          :class="locale === lang.code
            ? 'bg-[var(--ca-kicker-bg)] ca-tone-gold font-semibold'
            : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]'"
          @click="selectLanguage(lang.code)"
        >
          <span class="text-base leading-none">{{ lang.flag }}</span>
          <span>{{ lang.name }}</span>
          <Icon
            v-if="locale === lang.code"
            name="lucide:check"
            class="ml-auto h-4 w-4"
          />
        </button>
      </div>
    </Transition>
  </div>
</template>
