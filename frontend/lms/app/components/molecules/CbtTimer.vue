<script setup lang="ts">
import { Clock } from 'lucide-vue-next'

const props = defineProps<{
  durationMinutes: number
}>()

const emit = defineEmits(['timeout'])

const timeLeft = ref(props.durationMinutes * 60)
let timer: any = null

const formattedTime = computed(() => {
  const h = Math.floor(timeLeft.value / 3600)
  const m = Math.floor((timeLeft.value % 3600) / 60)
  const s = timeLeft.value % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

const isUrgent = computed(() => timeLeft.value < 300) // 5 minutes

onMounted(() => {
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timer)
      emit('timeout')
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div 
    class="flex items-center gap-3 px-4 py-2 rounded-xl transition-colors font-mono text-lg font-bold"
    :class="isUrgent ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-brand/10 text-brand'"
  >
    <Clock class="w-5 h-5" />
    <span>{{ formattedTime }}</span>
  </div>
</template>
