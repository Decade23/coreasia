<script setup lang="ts">
import type { Applicant } from '../../types/assessor'
import { User, ClipboardList, Calendar, ArrowRight } from 'lucide-vue-next'

const props = defineProps<{
  applicant: Applicant
}>()

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="ca-card p-6 group">
    <div class="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -mr-16 -mt-16" />
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
      <div class="flex items-center gap-5">
        <div class="w-14 h-14 rounded-2xl bg-tint border border-divider-strong flex items-center justify-center text-content-muted group-hover:text-brand group-hover:bg-brand/10 transition-colors duration-300">
          <User class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-lg font-bold text-content group-hover:text-brand transition-colors">{{ applicant.name }}</h3>
          <p class="text-xs text-content-subtle tracking-wider uppercase font-bold">{{ applicant.nik }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-6">
        <div class="bg-core-900/50 px-4 py-2 rounded-xl border border-divider">
          <div class="flex items-center gap-2 text-brand mb-1">
            <ClipboardList class="w-3.5 h-3.5" />
            <span class="text-[10px] font-black uppercase tracking-widest">Skema</span>
          </div>
          <span class="text-sm font-bold text-content">{{ applicant.schemeName }}</span>
        </div>

        <div class="bg-core-900/50 px-4 py-2 rounded-xl border border-divider">
          <div class="flex items-center gap-2 text-content-subtle mb-1">
            <Calendar class="w-3.5 h-3.5" />
            <span class="text-[10px] font-black uppercase tracking-widest">Tgl. Daftar</span>
          </div>
          <span class="text-sm font-bold text-content">{{ formatDate(applicant.submittedAt) }}</span>
        </div>

        <button 
          @click="navigateTo(`/assessor/review/${applicant.id}`)"
          class="ca-btn-primary py-3"
        >
          Tinjau Berkas
          <ArrowRight class="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  </div>
</template>
