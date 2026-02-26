<script setup lang="ts">
defineProps<{
    title: string
    subtitle?: string
}>()
</script>

<template>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div>
            <h1 class="text-2xl md:text-3xl font-black tracking-tight text-content">{{ title }}</h1>
            <p v-if="subtitle" class="text-sm text-content-subtle hidden md:block mt-1">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="flex items-center gap-3 shrink-0">
            <slot name="actions" />
        </div>
    </div>
</template>
