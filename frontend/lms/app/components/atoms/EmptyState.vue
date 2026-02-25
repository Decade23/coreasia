<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

defineProps<{
    title?: string
    description?: string
}>()
</script>

<template>
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <slot name="icon">
                <Inbox class="w-8 h-8 text-content-muted" />
            </slot>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">{{ title || 'Belum ada data' }}</h3>
        <p class="text-sm text-content-subtle max-w-sm">{{ description || 'Data yang Anda cari belum tersedia saat ini.' }}</p>
        <div v-if="$slots.action" class="mt-6">
            <slot name="action" />
        </div>
    </div>
</template>
