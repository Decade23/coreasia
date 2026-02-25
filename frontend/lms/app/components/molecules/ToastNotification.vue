<script setup lang="ts">
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useNotificationStore } from '~/stores/useNotificationStore'

const store = useNotificationStore()

const getIcon = (variant: string) => {
    switch (variant) {
        case 'success': return CheckCircle
        case 'error': return XCircle
        case 'warning': return AlertTriangle
        default: return Info
    }
}

const getStyles = (variant: string) => {
    switch (variant) {
        case 'success': return 'border-emerald-500/30 bg-emerald-500/10'
        case 'error': return 'border-red-500/30 bg-red-500/10'
        case 'warning': return 'border-amber-500/30 bg-amber-500/10'
        default: return 'border-brand/30 bg-brand/10'
    }
}

const getIconColor = (variant: string) => {
    switch (variant) {
        case 'success': return 'text-emerald-500'
        case 'error': return 'text-red-400'
        case 'warning': return 'text-amber-400'
        default: return 'text-brand'
    }
}
</script>

<template>
    <Teleport to="body">
        <div class="fixed top-4 right-4 z-[200] space-y-3 w-80 pointer-events-none">
            <TransitionGroup
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 translate-x-8"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 translate-x-8"
            >
                <div
                    v-for="toast in store.toasts"
                    :key="toast.id"
                    class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-xl"
                    :class="getStyles(toast.variant)"
                >
                    <component :is="getIcon(toast.variant)" class="w-5 h-5 shrink-0 mt-0.5" :class="getIconColor(toast.variant)" />
                    <p class="flex-1 text-sm text-white font-medium">{{ toast.message }}</p>
                    <button
                        class="shrink-0 text-content-subtle hover:text-white transition-colors"
                        @click="store.removeToast(toast.id)"
                    >
                        <X class="w-4 h-4" />
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>
