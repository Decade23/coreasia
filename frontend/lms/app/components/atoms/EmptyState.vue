<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

defineProps<{
    title?: string
    description?: string
}>()
</script>

<template>
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center ca-card-glass rounded-3xl mx-auto max-w-2xl relative overflow-hidden group">
        <!-- Glow effect -->
        <div class="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div class="w-16 h-16 rounded-2xl bg-gradient-brand border border-divider flex items-center justify-center mb-6 shadow-glow-cyan-card group-hover:scale-110 transition-transform duration-500">
            <slot name="icon">
                <Inbox class="w-8 h-8 text-core-950" />
            </slot>
        </div>
        <h3 class="text-lg font-bold text-content mb-2">{{ title || 'Belum ada data' }}</h3>
        <p class="text-sm text-content-subtle max-w-sm">{{ description || 'Data yang Anda cari belum tersedia saat ini.' }}</p>
        <div v-if="$slots.action" class="mt-6">
            <slot name="action" />
        </div>
    </div>
</template>
