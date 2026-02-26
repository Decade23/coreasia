<script setup lang="ts">
import { Check } from 'lucide-vue-next'

const props = defineProps<{
  steps: string[]
  currentStep: number
}>()
</script>

<template>
  <div class="w-full max-w-2xl mx-auto mb-8 md:mb-12">
    <!-- Mobile Step Text -->
    <div class="md:hidden text-center mb-6 text-sm font-bold text-brand uppercase tracking-widest">
      Langkah {{ currentStep + 1 }} dari {{ steps.length }}: <span class="text-content">{{ steps[currentStep] }}</span>
    </div>

    <div class="flex items-center justify-between w-full">
      <div v-for="(step, index) in steps" :key="index" class="flex items-center flex-1 last:flex-none">
        <div class="flex flex-col items-center relative group">
          <div 
            class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 z-10 relative"
            :class="[
              index <= currentStep 
                ? 'bg-brand border-brand text-slate-950 font-black shadow-lg shadow-brand/20' 
                : 'bg-core-900 border-core-700 text-content-muted',
              index === currentStep ? 'scale-110 ring-4 ring-brand/20' : ''
            ]"
          >
            <Check v-if="index < currentStep" class="w-4 h-4 md:w-6 md:h-6" />
            <span v-else class="text-xs md:text-sm">{{ index + 1 }}</span>
          </div>
          
          <span 
            class="hidden md:block absolute top-12 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors duration-300"
            :class="index <= currentStep ? 'text-brand' : 'text-content-muted'"
          >
            {{ step }}
          </span>
        </div>
        
        <div 
          v-if="index < steps.length - 1"
          class="flex-1 h-0.5 mx-2 md:mx-4 transition-all duration-700 rounded-full relative overflow-hidden bg-core-800"
        >
          <div 
            class="absolute inset-y-0 left-0 bg-brand transition-all duration-700"
            :style="{ width: index < currentStep ? '100%' : '0%' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
