<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { Search, Filter, CheckCircle, XCircle, Clock, FileText, ChevronRight } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()

// Mock Data
const verifications = ref([
  { id: 'APP-2023-081', name: 'Budi Santoso', scheme: 'Junior Web Developer', status: 'DRAFT', date: 'Hari ini, 09:30' },
  { id: 'APP-2023-082', name: 'Siti Aminah', scheme: 'Desainer Grafis Muda', status: 'SUBMITTED', date: 'Kemarin, 14:15' },
  { id: 'APP-2023-080', name: 'Andi Kusuma', scheme: 'Junior Web Developer', status: 'VERIFIED', date: '12 Nov 2023' },
  { id: 'APP-2023-079', name: 'Rinawati', scheme: 'Digital Marketing', status: 'REVISION_NEEDED', date: '10 Nov 2023' },
])

const schemeFilter = ref('Semua Skema')
const statusFilter = ref('Semua Status')
const searchQuery = ref('')

const getStatusColor = (status: string) => {
  switch (status) {
    case 'SUBMITTED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'VERIFIED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    case 'REVISION_NEEDED': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    default: return 'bg-core-700/50 text-content-muted border-core-600' // DRAFT
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'SUBMITTED': return 'Menunggu Verifikasi'
    case 'VERIFIED': return 'Terverifikasi'
    case 'REVISION_NEEDED': return 'Butuh Revisi'
    default: return 'Draft Asesi'
  }
}
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h1 class="text-xl md:text-3xl font-bold truncate mr-4 text-white">Verifikasi Berkas</h1>
          <p class="text-sm text-content-subtle hidden md:block mt-1">Review kelengkapan dokumen APL-01 dan APL-02 asesi.</p>
        </div>
      </div>
    </template>

    <div class="py-6 space-y-6">
      
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 rounded-2xl bg-core-800 border border-white/5 shadow-xl">
           <div class="text-3xl font-black text-white mb-1">12</div>
           <p class="text-xs font-bold text-content-subtle uppercase tracking-widest">Total Antrean</p>
        </div>
        <div class="p-4 rounded-2xl bg-brand-secondary/5 border border-brand-secondary/20 shadow-xl">
           <div class="text-3xl font-black text-brand-secondary mb-1">5</div>
           <p class="text-xs font-bold text-brand-secondary/70 uppercase tracking-widest">Perlu Direview</p>
        </div>
        <div class="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 shadow-xl">
           <div class="text-3xl font-black text-orange-400 mb-1">3</div>
           <p class="text-xs font-bold text-orange-400/70 uppercase tracking-widest">Menunggu Revisi</p>
        </div>
        <div class="p-4 rounded-2xl bg-brand/5 border border-brand/20 shadow-xl shadow-brand/5">
           <div class="text-3xl font-black text-brand mb-1">44</div>
           <p class="text-xs font-bold text-brand/70 uppercase tracking-widest">Selesai (Bulan Ini)</p>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-[#0F1423] shadow-xl glass-card">
        <div class="w-full lg:w-96">
          <CaInputSearch v-model="searchQuery" placeholder="Cari nama asesi atau No. Registrasi..." />
        </div>
        
        <div class="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
           <CaSelect
             id="filter-status"
             :options="[
               { value: 'Semua Status', label: 'Semua Status' },
               { value: 'Menunggu Verifikasi', label: 'Menunggu Verifikasi' },
               { value: 'Butuh Revisi', label: 'Butuh Revisi' },
               { value: 'Terverifikasi', label: 'Terverifikasi' }
             ]"
             v-model="statusFilter"
             class="w-full sm:w-56"
           />
           <CaSelect
             id="filter-scheme"
             :options="[
               { value: 'Semua Skema', label: 'Semua Skema' },
               { value: 'Junior Web Developer', label: 'Junior Web Developer' },
               { value: 'Desainer Grafis Muda', label: 'Desainer Grafis Muda' }
             ]"
             v-model="schemeFilter"
             class="w-full sm:w-64"
           />
        </div>
      </div>

      <!-- Verification List Table -->
      <div class="ca-card overflow-hidden !rounded-[2rem] p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-core-900/80 border-b border-white/5">
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest whitespace-nowrap pl-6">No. Registrasi</th>
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Asesi</th>
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Skema Sertifikasi</th>
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest whitespace-nowrap">Tanggal Submit</th>
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Status</th>
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="item in verifications" :key="item.id" class="hover:bg-core-800 transition-colors group">
                <td class="p-4 font-mono text-xs text-brand pl-6">{{ item.id }}</td>
                <td class="p-4 font-bold text-white whitespace-nowrap">{{ item.name }}</td>
                <td class="p-4 text-sm text-content-muted">{{ item.scheme }}</td>
                <td class="p-4 text-sm text-content-muted whitespace-nowrap">{{ item.date }}</td>
                <td class="p-4">
                  <span 
                    class="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border whitespace-nowrap inline-block"
                    :class="getStatusColor(item.status)"
                  >
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
                <td class="p-4 pr-6 text-right">
                  <CaButton 
                    variant="outline" 
                    size="sm" 
                    class="px-3"
                    :disabled="item.status === 'DRAFT'"
                  >
                    <span class="mr-1">Review</span>
                    <ChevronRight class="w-4 h-4" />
                  </CaButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </DashboardLayout>
</template>
