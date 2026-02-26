<script setup lang="ts">
withDefaults(defineProps<{
    width?: string
    height?: string
    rounded?: string
}>(), {
    width: 'w-full',
    height: 'h-4',
    rounded: 'rounded-lg',
})
</script>

<template>
    <div
        class="animate-pulse bg-tint"
        :class="[width, height, rounded]"
    />
</template>
