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
        class="animate-pulse bg-white/[0.06]"
        :class="[width, height, rounded]"
    />
</template>
