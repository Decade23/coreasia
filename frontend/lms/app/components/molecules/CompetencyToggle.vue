<script setup lang="ts">
const props = defineProps<{
  modelValue: 'K' | 'BK' | null
}>()

const emit = defineEmits(['update:modelValue'])

const setStatus = (status: 'K' | 'BK') => {
  emit('update:modelValue', status)
}
</script>

<template>
  <div class="flex items-center p-1 bg-core-900 rounded-xl border border-core-700 w-fit">
    <button
      @click="setStatus('K')"
      class="px-4 py-2 rounded-lg font-bold text-xs transition-all uppercase tracking-widest"
      :class="modelValue === 'K' 
        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
        : 'text-content-subtle hover:text-content'"
    >
      K (Kompeten)
    </button>
    <button
      @click="setStatus('BK')"
      class="px-4 py-2 rounded-lg font-bold text-xs transition-all uppercase tracking-widest"
      :class="modelValue === 'BK' 
        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
        : 'text-content-subtle hover:text-content'"
    >
      BK (Belum Kompeten)
    </button>
  </div>
</template>
