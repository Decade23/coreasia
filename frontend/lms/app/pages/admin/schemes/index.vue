<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CaInputSearch from '~/components/molecules/CaInputSearch.vue'
import SchemeCard from '~/components/organisms/SchemeCard.vue'
import { Plus, Filter } from 'lucide-vue-next'
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
          <h1 class="text-2xl md:text-3xl font-black tracking-tight text-white">Manajemen Skema</h1>
          <p class="text-sm text-content-subtle hidden md:block mt-1">Kelola daftar sertifikasi dan unit kompetensi aktif.</p>
        </div>
        
        <div class="flex items-center gap-4 shrink-0">
          <!-- Inline Search Bar inside Header for clean look on Desktop -->
          <div class="relative hidden lg:block w-64 xl:w-80 mr-2">
            <CaInputSearch v-model="searchQuery" placeholder="Cari skema..." />
          </div>

          <CaButton variant="primary" class="rounded-full px-6 py-3 flex items-center gap-2 transition-all hover:scale-105">
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Skema Baru</span>
          </CaButton>
        </div>
      </div>
    </template>

    <div class="py-6 space-y-8">
      <!-- Mobile Search (Visible only on small screens) -->
      <div class="lg:hidden flex gap-3">
        <CaInputSearch v-model="searchQuery" placeholder="Cari kode atau nama skema..." />
        <button class="shrink-0 w-14 h-14 rounded-xl bg-[#1A2235] flex items-center justify-center text-cyan-400 hover:text-white hover:bg-cyan-500 transition-all">
          <Filter class="w-5 h-5" />
        </button>
      </div>

      <!-- Data List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SchemeCard 
          v-for="scheme in schemes" 
          :key="scheme.id" 
          :scheme="scheme"
          @manage="console.log('manage', $event)"
        />
      </div>
    </div>
  </DashboardLayout>
</template>
