<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { Plus, Search, Filter, MoreVertical, BookOpen, Layers } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()

// Mock Data
const schemes = ref([
  { id: 'SCH-001', code: 'JWD', name: 'Junior Web Developer', unitCount: 5, active: true },
  { id: 'SCH-002', code: 'DGM', name: 'Desainer Grafis Muda', unitCount: 3, active: true },
  { id: 'SCH-003', code: 'DM', name: 'Digital Marketing', unitCount: 4, active: false },
])

const searchQuery = ref('')
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h1 class="text-xl md:text-3xl font-bold truncate mr-4 text-white">Manajemen Skema</h1>
          <p class="text-sm text-content-subtle hidden md:block mt-1">Kelola Skema Sertifikasi dan Unit Kompetensi.</p>
        </div>
        
        <div class="flex items-center gap-3 shrink-0">
          <CaButton variant="primary" size="sm">
            <Plus class="w-4 h-4 mr-2" />
            Skema Baru
          </CaButton>
        </div>
      </div>
    </template>

    <div class="py-6 space-y-6">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-core-800/50 border border-core-700">
        <div class="relative w-full sm:w-96">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="w-4 h-4 text-content-subtle" />
          </div>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari kode atau nama skema..." 
            class="w-full bg-core-900 border border-core-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all placeholder:text-content-subtle/50"
          >
        </div>
        
        <CaButton variant="outline" size="sm" class="w-full sm:w-auto">
          <Filter class="w-4 h-4 mr-2" />
          Filter
        </CaButton>
      </div>

      <!-- Data List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="scheme in schemes" :key="scheme.id" class="p-6 rounded-3xl bg-core-800 border border-core-700 hover:border-brand/40 transition-colors group relative overflow-hidden flex flex-col h-full">
          <!-- Status Badge -->
          <div class="absolute top-6 right-6 flex items-center gap-2">
             <span 
              class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
              :class="scheme.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-core-700/50 text-content-muted border-core-600'"
             >
              {{ scheme.active ? 'Aktif' : 'Draft' }}
             </span>
             <button class="text-content-subtle hover:text-white transition-colors p-1">
               <MoreVertical class="w-4 h-4" />
             </button>
          </div>

          <div class="mb-6 mt-1 flex-1">
            <div class="w-12 h-12 rounded-2xl bg-core-900 border border-core-700 flex items-center justify-center mb-4 group-hover:bg-brand/10 group-hover:border-brand/20 transition-all text-brand">
              <BookOpen class="w-5 h-5" />
            </div>
            
            <div class="text-[10px] font-black text-brand uppercase tracking-widest mb-1">{{ scheme.code }}</div>
            <h3 class="text-lg font-bold text-white leading-tight pr-12">{{ scheme.name }}</h3>
          </div>

          <div class="pt-4 border-t border-core-700/50 flex items-center justify-between mt-auto">
            <div class="flex items-center gap-2 text-content-subtle text-xs font-medium">
              <Layers class="w-4 h-4" />
              <span>{{ scheme.unitCount }} Unit Kompetensi</span>
            </div>
            <a href="#" class="text-xs font-bold text-brand hover:text-white transition-colors">Kelola Unit &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
