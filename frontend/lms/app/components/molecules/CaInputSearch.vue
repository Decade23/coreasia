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
  <div class="relative w-full group">
    <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
      <Search class="w-5 h-5 text-content-muted group-focus-within:text-cyan-400 transition-colors" />
    </div>
    <input 
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text" 
      :placeholder="placeholder" 
      class="w-full bg-[#1A2235] rounded-xl pl-12 pr-4 py-3.5 h-[52px] text-white font-bold focus:outline-none shadow-inset-light focus:ring-2 focus:ring-cyan-500/50 focus:shadow-glow-cyan hover:bg-[#1E273C] transition-all placeholder:text-content-subtle placeholder:font-medium relative z-0"
    >
  </div>
</template>
