<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  variant: {
    type: String as () => 'success' | 'warning' | 'danger' | 'default',
    default: 'default'
  },
  type: {
     type: String as () => 'soft' | 'solid' | 'outline',
     default: 'soft'
  }
})

const variantClasses = computed(() => {
  if (props.type === 'soft') {
    switch (props.variant) {
      case 'success':
        return 'bg-emerald-500/15 text-emerald-400'
      case 'warning':
        return 'bg-amber-500/15 text-amber-400'
      case 'danger':
        return 'bg-red-500/15 text-red-400'
      default:
        return 'bg-tint text-content-muted'
    }
  }
  return 'bg-tint text-content-subtle'
})
</script>

<template>
  <span
    class="px-3 py-1.5 flex-none w-max rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest inline-flex items-center justify-center border-none"
    :class="variantClasses"
  >
    {{ text }}
  </span>
</template>
