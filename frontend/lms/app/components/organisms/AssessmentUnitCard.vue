<script setup lang="ts">
import type { CompetencyUnit } from '../../types/assessment'
import CompetencyToggle from '../molecules/CompetencyToggle.vue'
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
  <div class="rounded-3xl bg-core-800 border border-core-700 overflow-hidden shadow-xl transition-all">
    <button 
      @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between p-6 bg-core-900/50 hover:bg-core-900 transition-colors text-left"
    >
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
          <FileText class="w-6 h-6" />
        </div>
        <div>
          <span class="text-[10px] font-black text-brand uppercase tracking-widest">{{ unit.code }}</span>
          <h3 class="text-lg font-bold text-white">{{ unit.title }}</h3>
        </div>
      </div>
      <component :is="isOpen ? ChevronUp : ChevronDown" class="w-5 h-5 text-content-muted" />
    </button>

    <div v-if="isOpen" class="p-6 space-y-8 animate-fade-in">
      <div v-for="element in unit.elements" :key="element.id" class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-core-700"></div>
          <span class="text-[10px] font-black text-content-subtle uppercase tracking-widest">Elemen: {{ element.title }}</span>
          <div class="h-px flex-1 bg-core-700"></div>
        </div>

        <div class="space-y-3">
          <div 
            v-for="kuk in element.criteria" 
            :key="kuk.id"
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-core-900/30 border border-core-700/50"
          >
            <div class="flex gap-4">
              <span class="text-xs font-black text-brand uppercase">{{ kuk.id }}</span>
              <p class="text-sm text-content-muted leading-relaxed">{{ kuk.text }}</p>
            </div>
            
            <CompetencyToggle 
              :model-value="claims[kuk.id]?.status"
              @update:model-value="status => onStatusChange(kuk.id, status)"
            />
          </div>
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
