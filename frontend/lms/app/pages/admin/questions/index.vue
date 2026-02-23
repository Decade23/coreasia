<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CaInputSearch from '~/components/molecules/CaInputSearch.vue'
import BaseBadge from '~/components/atoms/BaseBadge.vue'
import { Plus, Filter, HelpCircle, FileText, UploadCloud, Eye, MoreVertical } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()

// Mock Data
const questions = ref([
  { id: 'Q-001', scheme: 'JWD', type: 'Pilihan Ganda', text: 'Apa fungsi utama dari tag <head> pada dokumen HTML?', difficulty: 'Mudah', active: true },
  { id: 'Q-002', scheme: 'JWD', type: 'Esai', text: 'Jelaskan perbedaan antara var, let, dan const dalam JavaScript.', difficulty: 'Sedang', active: true },
  { id: 'Q-003', scheme: 'DGM', type: 'Upload Bukti', text: 'Unggah file desain antarmuka aplikasi seluler dalam format .pdf resolusi tinggi.', difficulty: 'Sulit', active: false },
])

const schemeFilter = ref('Semua Skema')
const typeFilter = ref('Semua Tipe')
const searchQuery = ref('')
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white">Bank Soal</h1>
          <p class="text-sm text-content-subtle hidden md:block mt-1">Kelola perbendaharaan soal ujian untuk seluruh skema.</p>
        </div>
        
        <div class="flex items-center gap-4 shrink-0">
          <!-- Inline Search Bar inside Header for clean look on Desktop -->
          <div class="relative hidden lg:block w-64 xl:w-80">
            <CaInputSearch v-model="searchQuery" placeholder="Cari konten soal..." />
          </div>

          <div class="h-8 w-px bg-white/10 hidden lg:block"></div>

          <CaButton variant="primary" class="rounded-full px-5 py-2 flex items-center gap-2 transition-all hover:scale-105">
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Buat Soal</span>
          </CaButton>
        </div>
      </div>
    </template>

    <div class="py-6 space-y-8">
      <!-- Mobile Search & Filter Toolbar -->
      <div class="flex flex-col lg:hidden gap-4">
        <CaInputSearch v-model="searchQuery" placeholder="Cari konten soal..." />
        
        <div class="flex gap-3">
           <select v-model="schemeFilter" class="w-full bg-core-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50">
             <option>Semua Skema</option>
             <option>Junior Web Developer</option>
             <option>Desainer Grafis Muda</option>
           </select>
           <select v-model="typeFilter" class="w-full bg-core-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50">
             <option>Semua Tipe</option>
             <option>Pilihan Ganda</option>
             <option>Esai</option>
             <option>Upload Bukti</option>
             <option>Observasi</option>
           </select>
        </div>
      </div>

      <!-- Desktop Filter (Only visible on large screens since search is in header) -->
      <div class="hidden lg:flex justify-end gap-3">
        <select v-model="schemeFilter" class="bg-core-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 min-w-48 appearance-none cursor-pointer">
          <option>Semua Skema</option>
          <option>Junior Web Developer</option>
          <option>Desainer Grafis Muda</option>
        </select>
        <select v-model="typeFilter" class="bg-core-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 min-w-48 appearance-none cursor-pointer">
          <option>Semua Tipe</option>
          <option>Pilihan Ganda</option>
          <option>Esai</option>
          <option>Upload Bukti</option>
          <option>Observasi</option>
        </select>
      </div>

      <!-- Question List -->
      <div class="space-y-4">
        <div v-for="(q, idx) in questions" :key="q.id" class="ca-card group flex flex-col md:flex-row md:items-start gap-6 relative overflow-hidden p-6 hover:border-brand/30">
          
          <!-- Subtle Glow effect on hover -->
          <div class="absolute top-0 right-0 w-32 h-64 bg-brand/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <!-- Icon Box -->
          <div class="w-12 h-12 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand group-hover:border-brand/30 transition-colors z-10">
            <HelpCircle v-if="q.type === 'Pilihan Ganda'" class="w-5 h-5" />
            <FileText v-else-if="q.type === 'Esai'" class="w-5 h-5 text-brand" />
            <UploadCloud v-else-if="q.type === 'Upload Bukti'" class="w-5 h-5 text-brand" />
            <Eye v-else class="w-5 h-5 text-brand" />
          </div>
          
          <div class="flex-1 min-w-0 z-10">
             <div class="flex flex-wrap items-center gap-2 mb-3">
                 <BaseBadge :text="q.scheme" variant="default" type="solid" class="bg-white/10" />
                 <BaseBadge :text="q.type" variant="default" type="outline" class="border border-white/10 text-slate-400" />
                 <span 
                    class="px-2 py-0.5 text-[10px] uppercase font-black tracking-widest"
                    :class="{
                        'text-brand': q.difficulty === 'Mudah',
                        'text-brand-secondary': q.difficulty === 'Sedang',
                        'text-red-400': q.difficulty === 'Sulit'
                    }"
                 >
                     {{ q.difficulty }}
                 </span>
             </div>
             <p class="text-white font-medium text-sm md:text-base leading-relaxed group-hover:text-brand-100 transition-colors">{{ q.text }}</p>
          </div>

          <!-- Actions -->
          <div class="flex md:flex-col items-center gap-4 shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-white/10 w-full md:w-auto justify-between md:justify-start z-10">
              <BaseBadge 
               :text="q.active ? 'Aktif' : 'Draft'" 
               :variant="q.active ? 'success' : 'default'" 
               class="order-2 md:order-1" 
             />
             <div class="flex gap-2 order-1 md:order-2">
                 <button class="text-content-subtle hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold transition-all">Edit</button>
                 <button class="text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-xs font-semibold transition-all border border-transparent hover:border-red-500/20">Hapus</button>
             </div>
          </div>
        </div>
      </div>

    </div>
  </DashboardLayout>
</template>
