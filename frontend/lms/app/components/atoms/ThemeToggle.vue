<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '~/composables/useTheme'

const { isDark, toggle } = useTheme()
</script>

<template>
    <button
        @click="toggle"
        class="relative p-2 rounded-xl text-content-subtle hover:text-content transition-all duration-200 group"
        :title="isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'"
        aria-label="Toggle theme"
    >
        <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 rotate-[-90deg] scale-0"
            enter-to-class="opacity-100 rotate-0 scale-100"
            leave-active-class="transition-all duration-200 ease-in absolute inset-0 flex items-center justify-center"
            leave-from-class="opacity-100 rotate-0 scale-100"
            leave-to-class="opacity-0 rotate-90 scale-0"
            mode="out-in"
        >
            <Sun v-if="isDark" class="w-[18px] h-[18px]" />
            <Moon v-else class="w-[18px] h-[18px]" />
        </Transition>
    </button>
</template>
