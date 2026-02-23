<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { Plus, Search, Calendar, MapPin, Users, MoreVertical } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()

// Mock Data
const schedules = ref([
  { id: 'JAD-1201', title: 'Ujian JWD Gelombang 1', scheme: 'Junior Web Developer', date: '20 Nov 2023 - 21 Nov 2023', type: 'CBT Online', participants: 45, maxParticipants: 50, location: 'LMS CoreAsia', assessors: ['Hendrik K', 'Anita W'] },
  { id: 'JAD-1202', title: 'Ujian Praktek Desain Grafis', scheme: 'Desainer Grafis Muda', date: '25 Nov 2023', type: 'Lab Offline', participants: 20, maxParticipants: 20, location: 'Lab Komp. A', assessors: ['Budi M'] },
])

const searchQuery = ref('')
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h1 class="text-xl md:text-3xl font-bold truncate mr-4 text-white">Penjadwalan Ujian</h1>
          <p class="text-sm text-content-subtle hidden md:block mt-1">Atur jadwal, kuota, dan plotting asesor ujian kompetensi.</p>
        </div>
        
        <div class="flex items-center gap-3 shrink-0">
          <CaButton variant="primary" size="sm">
            <Plus class="w-4 h-4 mr-2" />
            Jadwal Baru
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
            placeholder="Cari nama jadwal..." 
            class="w-full bg-core-900 border border-core-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all placeholder:text-content-subtle/50"
          >
        </div>
      </div>

      <!-- Schedule List -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div v-for="jadwal in schedules" :key="jadwal.id" class="ca-card group p-6">
          
          <div class="flex pb-4 border-b border-white/5 justify-between items-start mb-4">
             <div>
                <span class="text-[10px] font-black text-brand uppercase tracking-widest">{{ jadwal.id }}</span>
                <h3 class="text-lg font-bold text-white mt-1">{{ jadwal.title }}</h3>
                <p class="text-content-muted text-sm mt-1 saturate-50">{{ jadwal.scheme }}</p>
             </div>
             <button class="text-content-subtle hover:text-white transition-colors p-1 bg-white/5 rounded-lg border border-white/10">
               <MoreVertical class="w-4 h-4" />
             </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Calendar class="w-4 h-4 text-brand" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase text-content-subtle tracking-widest block mb-0.5">Waktu Pelaksanaan</span>
                <span class="text-sm font-medium text-white">{{ jadwal.date }}</span>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <MapPin class="w-4 h-4 text-brand" />
              </div>
              <div>
                <span class="text-[10px] font-black uppercase text-content-subtle tracking-widest block mb-0.5">Metode / Lokasi</span>
                <span class="text-sm font-medium text-white">{{ jadwal.type }} 
                  <span class="text-content-muted block text-xs truncate">{{ jadwal.location }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-core-900/50 border border-white/5">
            <div class="flex items-center gap-2 w-full sm:w-auto">
              <Users class="w-4 h-4 text-cyan-400" />
              <div class="flex-1">
                 <div class="flex justify-between w-full mb-1">
                     <span class="text-xs font-bold text-white">{{ jadwal.participants }} <span class="text-content-subtle font-medium text-[10px] uppercase">dari</span> {{ jadwal.maxParticipants }} <span class="text-content-subtle font-medium text-[10px] uppercase">Terisi</span></span>
                 </div>
                 <div class="w-full sm:w-32 h-1.5 bg-core-800 rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all"
                      :class="jadwal.participants === jadwal.maxParticipants ? 'bg-brand-secondary' : 'bg-cyan-400'"
                      :style="{ width: `${(jadwal.participants / jadwal.maxParticipants) * 100}%` }" />
                 </div>
              </div>
            </div>

            <div class="flex -space-x-2">
              <div v-for="(assessor, index) in jadwal.assessors" :key="index" class="w-8 h-8 rounded-full bg-linear-to-br from-core-700 to-core-800 border-2 border-core-800 flex items-center justify-center text-[10px] font-black text-brand shadow-sm" :title="assessor">
                {{ assessor.substring(0,2).toUpperCase() }}
              </div>
              <div class="w-8 h-8 rounded-full bg-core-900 border-2 border-core-800 border-dashed flex items-center justify-center group cursor-pointer hover:border-brand/40 transition-colors" title="Tambah Asesor">
                <Plus class="w-3 h-3 text-content-subtle group-hover:text-brand" />
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </DashboardLayout>
</template>
