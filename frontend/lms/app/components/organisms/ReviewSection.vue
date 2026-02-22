<script setup lang="ts">
import type { CompetencyUnit } from '../../types/assessment'
import DecisionToggle from '../molecules/DecisionToggle.vue'
import { FileText, ExternalLink, ShieldCheck } from 'lucide-vue-next'

const props = defineProps<{
  unit: CompetencyUnit
  decisions: Record<string, any>
}>()

const emit = defineEmits(['update:decisions'])

const updateDecision = (kukId: string, status: 'K' | 'BK') => {
  const newDecisions = { ...props.decisions }
  newDecisions[kukId] = status
  emit('update:decisions', newDecisions)
}
</script>

<template>
  <div class="rounded-3xl bg-core-800 border border-core-700 overflow-hidden shadow-2xl">
    <!-- Unit Header -->
    <div class="p-6 bg-core-900/50 border-b border-core-700">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
          <ShieldCheck class="w-6 h-6" />
        </div>
        <div>
          <span class="text-[10px] font-black text-brand uppercase tracking-widest">{{ unit.code }}</span>
          <h3 class="text-lg font-bold text-white">{{ unit.title }}</h3>
        </div>
      </div>
    </div>

    <!-- Review Rows -->
    <div class="p-6 space-y-8">
      <div v-for="element in unit.elements" :key="element.id" class="space-y-4">
        <h4 class="text-xs font-black text-content-subtle uppercase tracking-widest pl-2 border-l-2 border-brand">{{ element.title }}</h4>
        
        <div class="space-y-3">
          <div 
            v-for="kuk in element.criteria" 
            :key="kuk.id"
            class="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 rounded-2xl bg-core-900/30 border border-core-700/50"
          >
            <!-- Criteria Text -->
            <div class="lg:col-span-5 flex gap-4">
              <span class="text-xs font-black text-brand uppercase font-mono">{{ kuk.id }}</span>
              <p class="text-sm text-content-muted leading-relaxed">{{ kuk.text }}</p>
            </div>

            <!-- Asesi Claim -->
            <div class="lg:col-span-2 flex flex-col items-center justify-center px-4 border-l border-r border-core-700/50 bg-core-800/30 rounded-xl">
              <span class="text-[9px] font-black text-content-subtle uppercase tracking-widest mb-1">Klaim Asesi</span>
              <span 
                class="px-3 py-1 rounded-lg font-black text-xs"
                :class="kuk.status === 'K' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'"
              >
                {{ kuk.status }}
              </span>
            </div>

            <!-- Proof Link -->
            <div class="lg:col-span-2 flex items-center justify-center">
              <button class="flex items-center gap-2 text-[10px] font-black uppercase text-brand hover:text-white transition-colors">
                <FileText class="w-3.5 h-3.5" />
                Bukti.pdf
                <ExternalLink class="w-3 h-3" />
              </button>
            </div>

            <!-- Assessor Decision -->
            <div class="lg:col-span-3 flex items-center justify-end">
              <DecisionToggle 
                :model-value="decisions[kuk.id]"
                @update:model-value="val => updateDecision(kuk.id, val)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
