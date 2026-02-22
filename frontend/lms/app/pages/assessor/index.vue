<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import ApplicantQueueCard from '~/components/organisms/ApplicantQueueCard.vue'
import { MOCK_APPLICANTS } from '~/types/assessor'
import { Search, Filter, RefreshCcw } from 'lucide-vue-next'

const applicants = ref(MOCK_APPLICANTS)
const searchQuery = ref('')
const isLoading = ref(false)

const filteredApplicants = computed(() => {
  return applicants.value.filter(app => 
    app.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    app.nik.includes(searchQuery.value)
  )
})

const refreshQueue = () => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h1 class="text-xl font-bold text-white">Dashboard Asesor</h1>
          <p class="text-[10px] text-brand font-black uppercase tracking-widest mt-1">Lembaga Sertifikasi Profesi CoreAsia</p>
        </div>

        <button 
          @click="refreshQueue"
          class="p-2 rounded-xl bg-core-800 border border-core-700 text-content-muted hover:text-white transition-all"
          :class="{ 'animate-spin': isLoading }"
        >
          <RefreshCcw class="w-5 h-5" />
        </button>
      </div>
    </template>

    <div class="max-w-5xl mx-auto space-y-8 py-6">
      <!-- Search & Filter Bar -->
      <div class="flex flex-col md:flex-row items-center gap-4">
        <div class="relative flex-1 group">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-subtle group-focus-within:text-brand transition-colors" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari nama atau NIK asesi..."
            class="w-full bg-core-900 border-2 border-core-800 rounded-2xl py-3 pl-12 pr-6 text-white focus:border-brand/50 outline-none transition-all"
          />
        </div>
        
        <button class="flex items-center gap-2 px-6 py-3 bg-core-800 border-2 border-core-700 rounded-2xl text-content-muted hover:border-brand/50 hover:text-white transition-all">
          <Filter class="w-4 h-4" />
          <span class="text-sm font-bold">Filter Status</span>
        </button>
      </div>

      <!-- Queue List -->
      <div class="space-y-4">
        <div class="flex items-center justify-between px-2">
          <h2 class="text-xs font-black uppercase tracking-widest text-content-muted">Antrean Peninjauan ({{ filteredApplicants.length }})</h2>
        </div>

        <div v-if="filteredApplicants.length > 0" class="space-y-4">
          <ApplicantQueueCard 
            v-for="app in filteredApplicants" 
            :key="app.id"
            :applicant="app"
          />
        </div>

        <div v-else class="py-20 text-center animate-fade-in">
          <div class="w-20 h-20 bg-core-800 rounded-full flex items-center justify-center mx-auto mb-6 text-content-subtle">
            <Search class="w-10 h-10" />
          </div>
          <h3 class="text-lg font-bold text-white">Tidak Ada Data Ditemukan</h3>
          <p class="text-sm text-content-muted">Coba ubah kata kunci pencarian Anda.</p>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
