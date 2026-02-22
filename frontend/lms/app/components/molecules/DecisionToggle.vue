<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: 'K' | 'BK' | null
}>()

const emit = defineEmits(['update:modelValue'])

const setDecision = (val: 'K' | 'BK') => {
  emit('update:modelValue', val)
}
</script>

<template>
  <div class="flex items-center gap-2 p-1.5 bg-core-900 rounded-2xl border border-core-700">
    <button 
      @click="setDecision('K')"
      class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
      :class="modelValue === 'K' 
        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
        : 'text-content-subtle hover:text-content hover:bg-core-800'"
    >
      <Check class="w-3.5 h-3.5" />
      K
    </button>
    <button 
      @click="setDecision('BK')"
      class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
      :class="modelValue === 'BK' 
        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
        : 'text-content-subtle hover:text-content hover:bg-core-800'"
    >
      <X class="w-3.5 h-3.5" />
      BK
    </button>
  </div>
</template>
