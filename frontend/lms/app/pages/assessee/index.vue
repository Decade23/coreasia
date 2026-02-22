<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { CheckCircle, Clock, CalendarDays, ExternalLink } from 'lucide-vue-next'
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
          <h1 class="text-xl md:text-3xl font-bold truncate mr-4 bg-clip-text text-transparent bg-linear-to-r from-white to-content-muted">Portal Asesi</h1>
          <p class="text-sm text-content-subtle hidden md:block mt-1">Selamat datang, {{ user?.name || 'Peserta' }}</p>
        </div>
        
        <div class="flex items-center gap-3 shrink-0">
          <CaButton variant="primary" size="sm" @click="navigateTo('/registration')">
            Daftar Sertifikasi Baru
          </CaButton>
        </div>
      </div>
    </template>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 py-4">
      
      <!-- Main Content Area: Status Pendaftaran -->
      <div class="lg:col-span-2 space-y-6">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <Clock class="w-5 h-5 text-brand" />
          Status Pendaftaran Saat Ini
        </h2>

        <div v-if="applications.length === 0" class="p-8 rounded-3xl border border-dashed border-core-700 bg-core-900/30 text-center">
          <p class="text-content-muted mb-4">Anda belum memiliki pendaftaran sertifikasi aktif.</p>
          <CaButton variant="outline" size="sm" @click="navigateTo('/registration')">Mulai Pendaftaran</CaButton>
        </div>

        <div v-else class="space-y-4">
          <div v-for="app in applications" :key="app.id" class="p-6 rounded-3xl bg-core-800 border border-core-700 shadow-xl relative overflow-hidden group">
            
            <div class="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <div class="w-32 h-32 bg-brand rounded-full blur-[50px] -mr-16 -mt-16" />
            </div>

            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span class="text-[10px] font-black text-content-subtle uppercase tracking-widest">{{ app.id }}</span>
                <h3 class="text-xl font-bold text-white mt-1 mb-2">{{ app.schemeName }}</h3>
                <span class="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold inline-flex items-center gap-1">
                  <CheckCircle class="w-3 h-3" />
                  Berkas Terverifikasi
                </span>
              </div>

              <!-- Jadwal Box if available -->
              <div v-if="app.examSchedule" class="p-4 rounded-2xl bg-core-900/50 border border-core-700 w-full md:w-auto min-w-[200px]">
                <div class="flex items-center gap-2 mb-3">
                  <CalendarDays class="w-4 h-4 text-brand" />
                  <span class="text-xs font-black text-content-subtle uppercase tracking-widest">Jadwal Ujian</span>
                </div>
                <p class="font-bold text-white text-sm">{{ app.examSchedule.date }}</p>
                <p class="text-content-muted text-xs mt-1">{{ app.examSchedule.time }} &bull; {{ app.examSchedule.location }}</p>
                <CaButton variant="secondary" size="sm" class="w-full mt-4 justify-center" @click="navigateTo('/cbt/simulation')">
                  Masuk Ujian (CBT)
                </CaButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Area: Sertifikat & Riwayat -->
      <div class="space-y-6">
         <h2 class="text-lg font-bold text-white flex items-center gap-2">
          Sertifikat Saya
        </h2>

        <div v-if="certificates.length === 0" class="p-6 rounded-3xl bg-core-900/50 border border-core-800 text-center">
          <p class="text-sm text-content-subtle">Belum ada sertifikat yang diraih.</p>
        </div>

        <div v-else class="space-y-4">
          <div v-for="cert in certificates" :key="cert.id" class="p-5 rounded-2xl bg-linear-to-br from-core-800 to-core-900 border border-core-700 hover:border-brand/50 transition-colors group cursor-pointer">
            <h4 class="font-bold text-sm text-white mb-2 line-clamp-2 group-hover:text-brand transition-colors">{{ cert.schemeName }}</h4>
            <div class="flex items-center justify-between text-xs">
              <span class="text-content-muted font-medium">No: {{ cert.id }}</span>
              <span class="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{{ cert.status }}</span>
            </div>
            <div class="mt-4 pt-4 border-t border-core-700/50 flex items-center justify-between">
              <span class="text-[10px] text-content-subtle">Berlaku s/d: {{ cert.validUntil }}</span>
              <button class="text-brand hover:text-white transition-colors">
                <ExternalLink class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </DashboardLayout>
</template>
