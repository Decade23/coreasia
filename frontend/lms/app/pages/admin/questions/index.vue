<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { Plus, Search, Filter, HelpCircle, FileText, UploadCloud, Eye } from 'lucide-vue-next'
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
          <h1 class="text-xl md:text-3xl font-bold truncate mr-4 text-white">Bank Soal</h1>
          <p class="text-sm text-content-subtle hidden md:block mt-1">Kelola perbendaharaan soal ujian untuk seluruh skema.</p>
        </div>
        
        <div class="flex items-center gap-3 shrink-0">
          <CaButton variant="primary" size="sm">
            <Plus class="w-4 h-4 mr-2" />
            Buat Soal
          </CaButton>
        </div>
      </div>
    </template>

    <div class="py-6 space-y-6">
      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-core-800/50 border border-core-700">
        <div class="relative w-full lg:w-96">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="w-4 h-4 text-content-subtle" />
          </div>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari konten soal..." 
            class="w-full bg-core-900 border border-core-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all placeholder:text-content-subtle/50"
          >
        </div>
        
        <div class="flex items-center gap-3 w-full lg:w-auto">
           <select v-model="schemeFilter" class="w-full sm:w-auto bg-core-900 border border-core-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50">
             <option>Semua Skema</option>
             <option>Junior Web Developer</option>
             <option>Desainer Grafis Muda</option>
           </select>
           <select v-model="typeFilter" class="w-full sm:w-auto bg-core-900 border border-core-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50">
             <option>Semua Tipe</option>
             <option>Pilihan Ganda</option>
             <option>Esai</option>
             <option>Upload Bukti</option>
             <option>Observasi</option>
           </select>
        </div>
      </div>

      <!-- Question List -->
      <div class="space-y-4">
        <div v-for="(q, idx) in questions" :key="q.id" class="p-6 rounded-2xl bg-core-800 border border-core-700 hover:border-brand/30 transition-colors group flex flex-col md:flex-row md:items-start gap-6">
          
          <div class="w-12 h-12 shrink-0 rounded-2xl bg-core-900 border border-core-700 flex items-center justify-center text-brand">
            <HelpCircle v-if="q.type === 'Pilihan Ganda'" class="w-5 h-5" />
            <FileText v-else-if="q.type === 'Esai'" class="w-5 h-5 text-blue-400" />
            <UploadCloud v-else-if="q.type === 'Upload Bukti'" class="w-5 h-5 text-purple-400" />
            <Eye v-else class="w-5 h-5 text-emerald-400" />
          </div>
          
          <div class="flex-1 min-w-0">
             <div class="flex flex-wrap items-center gap-2 mb-2">
                 <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-brand/10 text-brand border border-brand/20">{{ q.scheme }}</span>
                 <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-core-900 text-content-muted border border-core-700">{{ q.type }}</span>
                 <span 
                    class="px-2 py-0.5 rounded text-[10px] font-bold"
                    :class="{
                        'text-emerald-400': q.difficulty === 'Mudah',
                        'text-orange-400': q.difficulty === 'Sedang',
                        'text-red-400': q.difficulty === 'Sulit'
                    }"
                 >
                     {{ q.difficulty }}
                 </span>
             </div>
             <p class="text-white font-medium text-sm md:text-base leading-relaxed line-clamp-2 md:line-clamp-none">{{ q.text }}</p>
          </div>

          <div class="flex md:flex-col items-center gap-3 shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-core-700/50 w-full md:w-auto justify-between md:justify-start">
             <span 
              class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border order-2 md:order-1"
              :class="q.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-core-700/50 text-content-muted border-core-600'"
             >
              {{ q.active ? 'Aktif' : 'Draft' }}
             </span>
             <div class="flex gap-2 order-1 md:order-2">
                 <CaButton variant="outline" size="sm" class="px-3 text-xs">Edit</CaButton>
                 <CaButton variant="outline" size="sm" class="px-3 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10">Hapus</CaButton>
             </div>
          </div>

        </div>
      </div>

    </div>
  </DashboardLayout>
</template>
