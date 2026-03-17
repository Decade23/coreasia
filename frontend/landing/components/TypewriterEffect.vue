<script setup lang="ts">
const props = defineProps<{
    text: string
    speed?: number
}>()

const charCount = computed(() => props.text.length)
const duration = computed(() => {
    const ms = (props.speed || 50) * charCount.value
    return `${ms}ms`
})
</script>

<template>
    <span
        class="typewriter-reveal"
        :style="{ '--tw-chars': charCount, '--tw-duration': duration }"
    >{{ text }}<span class="typewriter-cursor">|</span></span>
</template>

<style scoped>
.typewriter-reveal {
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    max-width: 0;
    animation: typewriter-expand var(--tw-duration, 1.5s) steps(var(--tw-chars, 20)) forwards;
}

.typewriter-cursor {
    animation: blink 1s step-end infinite;
}

@keyframes typewriter-expand {
    to { max-width: 100%; }
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
    .typewriter-reveal {
        animation: none;
        max-width: 100%;
    }
    .typewriter-cursor {
        animation: none;
        display: none;
    }
}
</style>
