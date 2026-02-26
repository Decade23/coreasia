<script setup lang="ts">
withDefaults(defineProps<{
    size?: 'sm' | 'md' | 'lg'
    label?: string
}>(), {
    size: 'md',
})

const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-3',
}
</script>

<template>
    <div class="flex items-center justify-center gap-3">
        <div
            class="animate-spin rounded-full border-content-faint/30 border-t-brand"
            :class="sizes[size]"
        />
        <span v-if="label" class="text-sm font-medium text-content-subtle">{{ label }}</span>
    </div>
</template>
