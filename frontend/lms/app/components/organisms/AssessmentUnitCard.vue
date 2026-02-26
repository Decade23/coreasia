<script setup lang="ts">
import type { CompetencyUnit } from '../../types/assessment'
import { FileText, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps<{
  unit: CompetencyUnit
  claims: Record<string, any>
}>()

const isOpen = ref(true)
const emit = defineEmits(['update:claims'])

const onStatusChange = (kukId: string, status: 'K' | 'BK') => {
  const newClaims = { ...props.claims }
  newClaims[kukId] = { ...newClaims[kukId], status }
  emit('update:claims', newClaims)
}
</script>

<template>
  <div class="bg-core-800 rounded-[2rem] overflow-hidden transition-all duration-500 shadow-glow-base">
    <button 
      @click="isOpen = !isOpen"
      class="w-full flex flex-col sm:flex-row sm:items-center justify-between p-6 md:p-8 hover:bg-tint transition-colors text-left gap-6 group"
    >
      <div class="flex items-center gap-6">
        <div class="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10 group-hover:scale-110 transition-transform duration-300">
          <FileText class="w-7 h-7" />
        </div>
        <div>
          <span class="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">{{ unit.code }}</span>
          <h3 class="text-xl font-bold text-content leading-tight transition-colors">{{ unit.title }}</h3>
        </div>
      </div>
      <div class="self-end sm:self-auto w-10 h-10 rounded-full bg-tint flex items-center justify-center group-hover:bg-brand/20 transition-colors">
        <component :is="isOpen ? ChevronUp : ChevronDown" class="w-5 h-5 text-content-muted group-hover:text-content transition-colors" />
      </div>
    </button>

    <div v-if="isOpen" class="p-6 md:p-8 space-y-10 animate-fade-in bg-core-950/40">
      <div v-for="element in unit.elements" :key="element.id" class="space-y-6">
        <div class="flex items-center justify-center mb-8">
          <span class="text-[10px] font-black text-content-subtle uppercase tracking-widest text-center px-5 py-2 rounded-full bg-input">Elemen: {{ element.title }}</span>
        </div>

        <div class="space-y-4">
          <AssessmentCriteriaItem
            v-for="kuk in element.criteria"
            :key="kuk.id"
            :kuk="kuk"
            :claim-status="claims[kuk.id]?.status"
            @update:status="(status: 'K' | 'BK') => onStatusChange(kuk.id, status)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
