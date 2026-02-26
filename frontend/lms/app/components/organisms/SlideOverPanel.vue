<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
    open: boolean
    title?: string
    width?: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const widthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
}
</script>

<template>
    <Teleport to="body">
        <!-- Backdrop -->
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="open" class="fixed inset-0 z-[90] backdrop-blur-sm" :style="{ background: 'var(--th-overlay)' }" @click="emit('close')" />
        </Transition>

        <!-- Panel -->
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="translate-x-0"
            leave-to-class="translate-x-full"
        >
            <aside
                v-if="open"
                class="fixed top-0 right-0 bottom-0 z-[95] w-full bg-core-900 border-l border-divider flex flex-col overflow-hidden"
                :class="widthClass[width || 'md']"
            >
                <!-- Header -->
                <div class="flex items-center justify-between p-6 border-b border-divider shrink-0">
                    <slot name="header">
                        <h2 class="text-lg font-bold text-content">{{ title }}</h2>
                    </slot>
                    <button
                        class="w-10 h-10 rounded-xl bg-tint flex items-center justify-center text-content-subtle hover:text-content hover:bg-tint-hover transition-all"
                        @click="emit('close')"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>

                <!-- Body -->
                <div class="flex-1 overflow-y-auto p-6">
                    <slot />
                </div>

                <!-- Footer -->
                <div v-if="$slots.footer" class="p-6 border-t border-divider shrink-0">
                    <slot name="footer" />
                </div>
            </aside>
        </Transition>
    </Teleport>
</template>
