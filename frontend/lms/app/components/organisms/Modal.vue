<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
    open: boolean
    title?: string
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const widthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
}
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 backdrop-blur-sm" :style="{ background: 'var(--th-overlay)' }" @click="emit('close')" />

                <div class="relative w-full ca-card p-0 z-10 max-h-[90vh] flex flex-col" :class="widthClass[maxWidth || 'lg']">
                    <!-- Header -->
                    <div v-if="title || $slots.header" class="flex items-center justify-between p-6 border-b border-divider">
                        <slot name="header">
                            <h2 class="text-xl font-bold text-content">{{ title }}</h2>
                        </slot>
                        <button
                            class="w-10 h-10 rounded-xl bg-tint flex items-center justify-center text-content-subtle hover:text-content hover:bg-tint-hover transition-all shrink-0"
                            @click="emit('close')"
                        >
                            <X class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="p-6 overflow-y-auto flex-1">
                        <slot />
                    </div>

                    <!-- Footer -->
                    <div v-if="$slots.footer" class="p-6 border-t border-divider">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
