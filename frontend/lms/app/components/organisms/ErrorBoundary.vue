<script setup lang="ts">
import { AlertTriangle, RefreshCw } from 'lucide-vue-next'

defineProps<{
    title?: string
    description?: string
}>()

const error = ref<Error | null>(null)
const hasError = ref(false)

const handleError = (err: Error) => {
    error.value = err
    hasError.value = true
    console.error('[ErrorBoundary]', err)
}

const retry = () => {
    error.value = null
    hasError.value = false
}

onErrorCaptured((err: Error) => {
    handleError(err)
    return false
})
</script>

<template>
    <slot v-if="!hasError" />

    <div v-else class="ca-card flex flex-col items-center justify-center py-12 px-6 text-center">
        <div class="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-5">
            <AlertTriangle class="w-8 h-8 text-rose-500" />
        </div>

        <h3 class="text-lg font-bold text-white mb-2">
            {{ title || 'Terjadi Kesalahan' }}
        </h3>
        <p class="text-sm text-content-subtle max-w-md mb-6">
            {{ description || 'Komponen ini mengalami error. Silakan coba muat ulang atau hubungi administrator.' }}
        </p>

        <p v-if="error" class="text-xs font-mono text-rose-400/70 bg-rose-500/5 rounded-xl px-4 py-2 mb-6 max-w-lg break-all">
            {{ error.message }}
        </p>

        <button
            class="ca-btn ca-btn-secondary inline-flex items-center gap-2"
            @click="retry"
        >
            <RefreshCw class="w-4 h-4" />
            Coba Lagi
        </button>
    </div>
</template>
