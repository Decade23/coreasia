<script setup lang="ts">
import { ref } from 'vue'
import { AlertTriangle, X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
    message: string
    dismissable?: boolean
}>(), {
    dismissable: true,
})

const emit = defineEmits<{
    (e: 'dismiss'): void
}>()

const isVisible = ref(true)

const dismiss = () => {
    isVisible.value = false
    emit('dismiss')
}
</script>

<template>
    <div
        v-if="isVisible"
        role="alert"
        class="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 transition-all"
    >
        <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle class="w-4 h-4 text-red-500" />
        </div>
        <p class="text-sm font-medium text-red-400 flex-1">{{ message }}</p>
        <button
            v-if="dismissable"
            @click="dismiss"
            aria-label="Tutup peringatan"
            class="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors shrink-0"
        >
            <X class="w-4 h-4" />
        </button>
    </div>
</template>
