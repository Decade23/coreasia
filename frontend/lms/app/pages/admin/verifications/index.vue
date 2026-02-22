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
        <div class="p-4 rounded-2xl bg-core-800 border border-core-700">
           <div class="text-3xl font-black text-white mb-1">12</div>
           <p class="text-xs font-bold text-content-subtle uppercase tracking-widest">Total Antrean</p>
        </div>
        <div class="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
           <div class="text-3xl font-black text-blue-400 mb-1">5</div>
           <p class="text-xs font-bold text-blue-400/70 uppercase tracking-widest">Perlu Direview</p>
        </div>
        <div class="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20">
           <div class="text-3xl font-black text-orange-400 mb-1">3</div>
           <p class="text-xs font-bold text-orange-400/70 uppercase tracking-widest">Menunggu Revisi</p>
        </div>
        <div class="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
           <div class="text-3xl font-black text-emerald-500 mb-1">44</div>
           <p class="text-xs font-bold text-emerald-500/70 uppercase tracking-widest">Selesai (Bulan Ini)</p>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-core-800/50 border border-core-700">
        <div class="relative w-full lg:w-96">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="w-4 h-4 text-content-subtle" />
          </div>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Cari nama asesi atau No. Registrasi..." 
            class="w-full bg-core-900 border border-core-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all placeholder:text-content-subtle/50"
          >
        </div>
        
        <div class="flex items-center gap-3 w-full lg:w-auto">
           <select v-model="statusFilter" class="w-full sm:w-auto bg-core-900 border border-core-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50">
             <option>Semua Status</option>
             <option>Menunggu Verifikasi</option>
             <option>Butuh Revisi</option>
             <option>Terverifikasi</option>
           </select>
           <select v-model="schemeFilter" class="w-full sm:w-auto bg-core-900 border border-core-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50">
             <option>Semua Skema</option>
             <option>Junior Web Developer</option>
             <option>Desainer Grafis Muda</option>
           </select>
        </div>
      </div>

      <!-- Verification List Table -->
      <div class="bg-core-800 border border-core-700 rounded-3xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-core-900/50 border-b border-core-700">
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest whitespace-nowrap">No. Registrasi</th>
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Asesi</th>
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Skema Sertifikasi</th>
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest whitespace-nowrap">Tanggal Submit</th>
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Status</th>
                <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-core-700/50">
              <tr v-for="item in verifications" :key="item.id" class="hover:bg-core-700/20 transition-colors group">
                <td class="p-4 font-mono text-xs text-brand">{{ item.id }}</td>
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
                <td class="p-4 text-right">
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
