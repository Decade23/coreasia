<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
    text: string
    speed?: number
}>()

const displayedText = ref('')
const typingInterval = ref<NodeJS.Timeout | null>(null)

const typeText = () => {
    let i = 0
    displayedText.value = ''
    
    if (typingInterval.value) clearInterval(typingInterval.value)
    
    typingInterval.value = setInterval(() => {
        if (i < props.text.length) {
            displayedText.value += props.text.charAt(i)
            i++
        } else {
            if (typingInterval.value) clearInterval(typingInterval.value)
        }
    }, props.speed || 50)
}

onMounted(() => {
    typeText()
})

watch(() => props.text, () => {
    typeText()
})
</script>

<template>
    <span>{{ displayedText }}<span class="animate-blink">|</span></span>
</template>

<style scoped>
.animate-blink {
    animation: blink 1s step-end infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}
</style>