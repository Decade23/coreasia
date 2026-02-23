<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import BaseBadge from '~/components/atoms/BaseBadge.vue'
import { CheckCircle, Clock, CalendarDays, ExternalLink, ShieldCheck } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'

const { user } = useAuth()
const { t } = useI18n()

// This would normally be fetched via an ApplicationAdapter
const applications = ref([
  {
    id: 'APP-2023-001',
    schemeName: 'Junior Web Developer',
    status: 'VERIFIED',
    submitDate: '12 Nov 2023',
    examSchedule: {
      date: '20 Nov 2023',
      time: '09:00 WIB',
      location: 'Ujian Online (CBT)'
    }
  }
])

// This would normally be fetched via a CertificateAdapter
const certificates = ref([
  {
    id: 'CERT-2022-8829',
    schemeName: 'Desainer Grafis Muda',
    issueDate: '05 Jan 2022',
    validUntil: '05 Jan 2025',
    status: 'ACTIVE'
  }
])
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
             Portal Asesi
          </h1>
          <p class="text-sm text-slate-400 hidden md:block mt-2">Selamat datang kembali, <strong class="text-emerald-400">{{ user?.name || 'Peserta' }}</strong></p>
        </div>
        
        <div class="flex items-center gap-4 shrink-0">
          <CaButton variant="primary" class="rounded-full px-5 py-2 flex items-center gap-2 transition-all hover:scale-105" @click="navigateTo('/registration')">
            <span class="hidden sm:inline">Daftar Sertifikasi</span>
          </CaButton>
        </div>
      </div>
    </template>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 py-6">
      
      <!-- Main Content Area: Status Pendaftaran -->
      <div class="lg:col-span-2 space-y-6">
        <h2 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Clock class="w-6 h-6 text-emerald-400" />
          Status Pendaftaran Saat Ini
        </h2>

        <div v-if="applications.length === 0" class="p-8 rounded-[2rem] bg-[#1A2235] text-center">
          <p class="text-content-subtle mb-6">Anda belum memiliki pendaftaran sertifikasi aktif.</p>
          <button class="bg-cyan-500/15 text-cyan-400 font-black tracking-widest uppercase text-xs hover:bg-cyan-500/25 px-6 py-3 rounded-xl transition-all" @click="navigateTo('/registration')">Mulai Pendaftaran</button>
        </div>

        <div v-else class="space-y-4">
          <div v-for="app in applications" :key="app.id" class="ca-card group">
            
            <div class="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              <div class="w-48 h-48 bg-brand/10 rounded-full blur-[60px] -mr-16 -mt-16" />
            </div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 p-2">
              <div class="space-y-4">
                <div>
                  <span class="text-[10px] font-black text-brand uppercase tracking-widest">{{ app.id }}</span>
                  <h3 class="text-xl md:text-2xl font-bold text-white mt-1 leading-tight">{{ app.schemeName }}</h3>
                </div>
                
                <BaseBadge 
                  text="Berkas Terverifikasi" 
                  variant="success" 
                  type="soft" 
                />
              </div>

              <!-- Jadwal Box if available -->
              <div v-if="app.examSchedule" class="p-6 rounded-2xl bg-[#1A2235] w-full md:w-auto min-w-[240px] shadow-inset-light">
                <div class="flex items-center justify-between mb-4 pb-4">
                  <div class="flex items-center gap-2">
                    <CalendarDays class="w-4 h-4 text-cyan-400" />
                    <span class="text-[10px] font-black text-content-subtle uppercase tracking-widest">Jadwal Ujian</span>
                  </div>
                </div>
                <p class="font-bold text-white text-base md:text-lg">{{ app.examSchedule.date }}</p>
                <p class="text-cyan-400 text-xs font-bold mt-1.5 flex items-center gap-1.5">
                   <Clock class="w-3 h-3" /> {{ app.examSchedule.time }} &bull; {{ app.examSchedule.location }}
                </p>
                <CaButton variant="secondary" fullWidth class="mt-6" @click="navigateTo('/cbt/simulation')">
                  Masuk Ujian (CBT)
                </CaButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Area: Sertifikat & Riwayat -->
      <div class="space-y-6">
         <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck class="w-6 h-6 text-brand" />
          Sertifikat Saya
        </h2>

        <div v-if="certificates.length === 0" class="p-6 ca-card text-center">
          <p class="text-sm text-content-subtle">Belum ada sertifikat yang diraih.</p>
        </div>

        <div v-else class="space-y-4">
          <div v-for="cert in certificates" :key="cert.id" class="bg-[#0F1423] rounded-2xl group cursor-pointer p-6 hover:-translate-y-1 hover:shadow-glow-base-strong transition-all duration-300 relative overflow-hidden">
            
            <!-- Deco -->
            <div class="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <h4 class="font-bold text-base md:text-lg text-white mb-3 line-clamp-2 group-hover:text-cyan-400 transition-colors relative z-10">{{ cert.schemeName }}</h4>
            <div class="flex items-center justify-between text-xs mb-6 relative z-10">
              <span class="text-content-muted font-black tracking-widest text-[10px] uppercase">No: {{ cert.id }}</span>
              <BaseBadge :text="cert.status" variant="success" type="soft" />
            </div>
            <div class="pt-4 flex items-center justify-between relative z-10">
              <span class="text-[10px] font-black uppercase tracking-widest text-content-subtle">Berlaku s/d: <span class="text-white">{{ cert.validUntil }}</span></span>
              <button class="text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 p-2 rounded-lg transition-colors">
                <ExternalLink class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </DashboardLayout>
</template>
