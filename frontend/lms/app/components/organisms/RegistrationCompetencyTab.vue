<script setup lang="ts">
import type { CompetencyData } from '../../types/registration'

const props = defineProps<{
  modelValue: CompetencyData
}>()

const emit = defineEmits(['update:modelValue'])

const schemes = [
  { id: 'S-01', name: 'Junior Web Developer' },
  { id: 'S-02', name: 'Digital Marketing Specialist' },
  { id: 'S-03', name: 'Data Analyst Junior' },
]

const purposes = [
  { id: 'sertifikasi', label: 'Sertifikasi Baru' },
  { id: 'sertifikasi_ulang', label: 'Sertifikasi Ulang' },
  { id: 'pkp', label: 'Pengakuan Kompetensi Terkini (PKT)' },
  { id: 'lainnya', label: 'Lainnya' },
]

const updateData = (key: keyof CompetencyData, value: string) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="space-y-8 p-6 md:p-10 ca-card shadow-brand-glow">
    <div class="space-y-4">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted ml-1">Pilih Skema Sertifikasi</label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="scheme in schemes"
          :key="scheme.id"
          @click="updateData('schemeId', scheme.id)"
          class="flex flex-col items-start p-6 rounded-2xl border transition-all text-left group relative overflow-hidden"
          :class="modelValue.schemeId === scheme.id 
            ? 'border-brand bg-brand/10 shadow-glow-amber' 
            : 'border-divider bg-tint hover:border-divider-hover hover:bg-tint-hover'"
        >
          <!-- Active Highlight -->
          <div v-if="modelValue.schemeId === scheme.id" class="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent pointer-events-none" />
          
          <span class="text-[10px] font-black uppercase tracking-widest mb-2 transition-colors relative z-10" :class="modelValue.schemeId === scheme.id ? 'text-brand' : 'text-content-subtle'">{{ scheme.id }}</span>
          <span class="font-bold text-lg transition-colors relative z-10" :class="modelValue.schemeId === scheme.id ? 'text-content' : 'text-content-muted group-hover:text-content'">{{ scheme.name }}</span>
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted ml-1">Tujuan Sertifikasi</label>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="purpose in purposes"
          :key="purpose.id"
          @click="updateData('purpose', purpose.id)"
          class="px-6 py-3.5 rounded-xl border transition-all font-bold text-sm flex-1 sm:flex-none justify-center relative overflow-hidden group/purpose"
          :class="modelValue.purpose === purpose.id 
            ? 'border-transparent bg-gradient-to-r from-brand to-brand-400 text-slate-950 shadow-lg shadow-brand/20' 
            : 'border-divider bg-core-800/50 text-content-subtle hover:bg-tint-hover hover:text-content'"
        >
          <span class="relative z-10 block transition-transform group-hover/purpose:scale-105">{{ purpose.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
