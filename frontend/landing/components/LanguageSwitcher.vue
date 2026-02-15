<script setup lang="ts">
import { LOCALES, type Locale } from '~/utils/i18n'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { locale, availableLocales, setLocale } = useCoreI18n()

// Toggle language menu
const isOpen = ref(false)

// Handle language selection
const selectLanguage = (newLocale: string) => {
  setLocale(newLocale)
  isOpen.value = false
  
  // Reload page to apply new language
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

// Close menu when clicking outside
const closeMenu = () => {
  isOpen.value = false
}

// Watch for clicks outside
onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('.language-switcher')) {
        closeMenu()
      }
    })
  }
})
</script>

<template>
  <div class="language-switcher relative">
    <!-- Current Language Button -->
    <button
      type="button"
      class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-content-DEFAULT transition hover:border-white/20 hover:bg-white/[0.06]"
      @click="isOpen = !isOpen"
      :aria-expanded="isOpen"
      aria-label="Select language"
    >
      <span class="text-base">{{ (availableLocales as Locale[]).find((l: Locale) => l.code === locale)?.flag }}</span>
      <span class="hidden sm:inline">{{ (availableLocales as Locale[]).find((l: Locale) => l.code === locale)?.name }}</span>
      <Icon
        name="lucide:chevron-down"
        class="h-4 w-4 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Language Options Dropdown -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/10 bg-core-950/95 backdrop-blur-md shadow-[0_18px_60px_rgba(2,6,23,0.42)]"
      >
        <div class="py-2">
          <button
            v-for="lang in availableLocales"
            :key="lang.code"
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition hover:bg-white/[0.06]"
            :class="locale === lang.code ? 'text-brand-primary bg-white/[0.05]' : 'text-content-DEFAULT'"
            @click="selectLanguage(lang.code)"
          >
            <span class="text-base">{{ lang.flag }}</span>
            <span>{{ lang.name }}</span>
            
            <!-- Current indicator -->
            <Icon
              v-if="locale === lang.code"
              name="lucide:check"
              class="ml-auto h-4 w-4 text-brand-primary"
            />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>