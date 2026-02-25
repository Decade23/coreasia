<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import CaButton from '~/components/atoms/CaButton.vue'

const props = withDefaults(defineProps<{
    open: boolean
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'warning' | 'default'
    loading?: boolean
}>(), {
    title: 'Konfirmasi',
    message: 'Apakah Anda yakin?',
    confirmLabel: 'Ya, Lanjutkan',
    cancelLabel: 'Batal',
    variant: 'default',
    loading: false,
})

const emit = defineEmits<{
    (e: 'confirm'): void
    (e: 'cancel'): void
}>()

const variantStyles = {
    danger: 'bg-red-500/20 text-red-500',
    warning: 'bg-amber-500/20 text-amber-500',
    default: 'bg-brand/20 text-brand',
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
            <div
                v-if="open"
                class="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-[#050814]/80 backdrop-blur-sm" @click="emit('cancel')" />

                <!-- Dialog -->
                <div class="relative w-full max-w-md ca-card p-8 z-10">
                    <div class="flex flex-col items-center text-center">
                        <div
                            class="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                            :class="variantStyles[variant]"
                        >
                            <AlertTriangle class="w-7 h-7" />
                        </div>

                        <h3 class="text-xl font-bold text-white mb-2">{{ title }}</h3>
                        <p class="text-sm text-content-subtle leading-relaxed mb-8">{{ message }}</p>

                        <div class="flex items-center gap-3 w-full">
                            <CaButton
                                variant="outline"
                                class="flex-1 justify-center"
                                :disabled="loading"
                                @click="emit('cancel')"
                            >
                                {{ cancelLabel }}
                            </CaButton>
                            <CaButton
                                variant="primary"
                                class="flex-1 justify-center"
                                :loading="loading"
                                @click="emit('confirm')"
                            >
                                {{ confirmLabel }}
                            </CaButton>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
