<script setup lang="ts">
defineProps<{
    message?: string
}>()
</script>

<template>
    <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
    >
        <p v-if="message" class="mt-1.5 text-xs font-bold text-rose-500">
            {{ message }}
        </p>
    </Transition>
</template>
