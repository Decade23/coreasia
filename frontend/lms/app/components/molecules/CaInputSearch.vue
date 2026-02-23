<script setup lang="ts">
import { Search } from 'lucide-vue-next'

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Cari...'
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="relative w-full">
    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Search class="w-4 h-4 text-content-muted" />
    </div>
    <input 
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text" 
      :placeholder="placeholder" 
      class="w-full bg-[#1A2235] border-none rounded-xl pl-11 pr-4 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50 focus:shadow-glow-cyan transition-all placeholder:text-content-subtle placeholder:font-medium"
    >
  </div>
</template>
