<script setup lang="ts">
import { type Locale } from '~/utils/i18n'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { locale, availableLocales, setLocale } = useCoreI18n()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const dropdownPos = ref<{ top: number; left?: number; right?: number }>({ top: 0, right: 0 })

const updatePosition = () => {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const isRightHalf = rect.left > window.innerWidth / 2
  dropdownPos.value = isRightHalf
    ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
    : { top: rect.bottom + 8, left: rect.left }
}

const open = () => {
  updatePosition()
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

const handleOutsideClick = (event: MouseEvent) => {
  const target = event.target as Node
  if (triggerRef.value?.contains(target) || dropdownRef.value?.contains(target)) return
  close()
}

onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))

const selectLanguage = (newLocale: string) => {
  setLocale(newLocale)
  close()
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

const currentLocale = computed(() =>
  availableLocales.value.find((l: Locale) => l.code === locale.value)
)

const flagIsText = computed(() => {
  const flag = currentLocale.value?.flag ?? ''
  return flag.length <= 2
})
</script>

<template>
  <div class="relative">
    <button
      ref="triggerRef"
      type="button"
      class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-toggle-track)] text-[var(--ca-text)] shadow-[var(--ca-toggle-thumb-shadow)] transition hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)] hover:bg-[var(--ca-panel-bg-strong)]"
      :aria-expanded="isOpen"
      aria-label="Select language"
      @click="isOpen ? close() : open()"
    >
      <span
        :class="flagIsText ? 'text-xs font-bold tracking-wide' : 'text-base leading-none'"
      >{{ currentLocale?.flag }}</span>
    </button>

    <Teleport to="body">
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
          ref="dropdownRef"
          class="ca-field-dropdown fixed w-44 rounded-xl py-1 shadow-2xl"
          :style="{
            top: `${dropdownPos.top}px`,
            ...(dropdownPos.right !== undefined ? { right: `${dropdownPos.right}px` } : { left: `${dropdownPos.left}px` }),
            zIndex: 9999,
          }"
        >
          <button
            v-for="lang in availableLocales"
            :key="lang.code"
            type="button"
            class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors"
            :class="locale === lang.code
              ? 'bg-(--ca-kicker-bg) ca-tone-gold font-semibold'
              : 'text-(--ca-muted) hover:bg-(--ca-panel-bg-strong) hover:text-(--ca-text)'"
            @click="selectLanguage(lang.code)"
          >
            <span
              :class="lang.flag.length <= 2 ? 'inline-flex h-6 w-6 items-center justify-center rounded-full border border-(--ca-border) bg-(--ca-panel-bg-strong) text-xs font-bold tracking-wide' : 'text-base leading-none'"
            >{{ lang.flag }}</span>
            <span>{{ lang.name }}</span>
            <Icon
              v-if="locale === lang.code"
              name="lucide:check"
              class="ml-auto h-4 w-4"
            />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
