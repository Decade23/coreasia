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
  <div class="space-y-8 p-8 rounded-3xl bg-core-900 border border-core-800 shadow-2xl">
    <div class="space-y-4">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted block">Pilih Skema Sertifikasi</label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="scheme in schemes"
          :key="scheme.id"
          @click="updateData('schemeId', scheme.id)"
          class="flex flex-col items-start p-6 rounded-2xl border-2 transition-all text-left group"
          :class="modelValue.schemeId === scheme.id 
            ? 'border-brand bg-brand/5 ring-1 ring-brand' 
            : 'border-core-800 bg-core-900/50 hover:border-brand/50 hover:bg-core-800'"
        >
          <span class="text-[10px] font-black uppercase tracking-widest mb-1" :class="modelValue.schemeId === scheme.id ? 'text-brand' : 'text-content-subtle'">{{ scheme.id }}</span>
          <span class="font-bold text-lg" :class="modelValue.schemeId === scheme.id ? 'text-white' : 'text-content-muted group-hover:text-content'">{{ scheme.name }}</span>
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted block">Tujuan Sertifikasi</label>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="purpose in purposes"
          :key="purpose.id"
          @click="updateData('purpose', purpose.id)"
          class="px-5 py-3 rounded-xl border-2 transition-all font-bold text-sm"
          :class="modelValue.purpose === purpose.id 
            ? 'border-brand bg-brand text-slate-950 shadow-lg shadow-brand/20' 
            : 'border-core-800 bg-core-900/50 text-content-muted hover:border-core-700'"
        >
          {{ purpose.label }}
        </button>
      </div>
    </div>
  </div>
</template>
