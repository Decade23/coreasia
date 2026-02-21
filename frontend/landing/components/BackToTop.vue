<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'

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
        <button
            v-if="isVisible"
            type="button"
            class="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-core-950/80 text-amber-400 backdrop-blur transition hover:border-amber-400/30 hover:bg-amber-400/10 sm:bottom-8 sm:right-8 sm:h-12 sm:w-12"
            aria-label="Scroll to top"
            @click="scrollToTop"
        >
            <Icon name="lucide:arrow-up" class="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
    </Transition>
</template>
