<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

const { t } = useCoreI18n()
const { y } = useWindowScroll()
const isVisible = computed(() => y.value > 500)

const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })
}
</script>

<template>
    <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
    >
        <!--
            Duduk di atas FloatingWhatsApp yang mengisi sudut kanan bawah (tinggi 3,5rem
            plus jarak 0,75rem), bukan di sudutnya sendiri, supaya keduanya tidak saling
            menimpa. Nilai right digeser agar titik tengahnya sejajar dengan tombol itu.
        -->
        <button
            v-if="isVisible"
            type="button"
            class="fixed bottom-[5.75rem] right-8 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] text-[var(--ca-brand)] backdrop-blur transition hover:border-[color:var(--ca-gold-border)] hover:bg-[var(--ca-gold-bg)] sm:bottom-[6.25rem] sm:right-9 sm:h-12 sm:w-12"
            :aria-label="t('components.backToTop.ariaLabel')"
            @click="scrollToTop"
        >
            <Icon name="lucide:arrow-up" class="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
    </Transition>
</template>
