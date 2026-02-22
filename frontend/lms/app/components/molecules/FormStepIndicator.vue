<script setup lang="ts">
import { Check } from 'lucide-vue-next'

defineProps<{
  steps: string[]
  currentStep: number
}>()
</script>

<template>
  <div class="flex items-center justify-between w-full max-w-2xl mx-auto mb-12">
    <div v-for="(step, index) in steps" :key="index" class="flex items-center flex-1 last:flex-none">
      <div class="flex flex-col items-center relative">
        <div 
          class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2"
          :class="index <= currentStep 
            ? 'bg-brand border-brand text-slate-950 font-bold' 
            : 'bg-core-900 border-core-700 text-content-muted'"
        >
          <Check v-if="index < currentStep" class="w-6 h-6" />
          <span v-else>{{ index + 1 }}</span>
        </div>
        <span 
          class="absolute top-12 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors"
          :class="index <= currentStep ? 'text-brand' : 'text-content-muted'"
        >
          {{ step }}
        </span>
      </div>
      
      <div 
        v-if="index < steps.length - 1"
        class="flex-1 h-0.5 mx-4 transition-all duration-300 rounded-full"
        :class="index < currentStep ? 'bg-brand' : 'bg-core-800'"
      />
    </div>
  </div>
</template>
