<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import ReviewSection from '~/components/organisms/ReviewSection.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { MOCK_APPLICANTS } from '~/types/assessor'
import { useNotificationStore } from '~/stores/useNotificationStore'

import { ArrowLeft, User, FileText, CheckCircle2 } from 'lucide-vue-next'

const route = useRoute()
const applicantId = route.params.id as string
const applicant = computed(() => MOCK_APPLICANTS.find(a => a.id === applicantId))
const notificationStore = useNotificationStore()

const { units } = await useAssessment()
const decisions = ref<Record<string, any>>({})
const isSubmitting = ref(false)

const submitReview = () => {
  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    notificationStore.success(`Rekomendasi untuk ${applicant.value?.name} telah berhasil dikirim.`)
    navigateTo('/assessor')
  }, 1000)
}
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center gap-4">
        <button @click="navigateTo('/assessor')" class="p-2 rounded-xl bg-core-800 border border-core-700 text-content-muted hover:text-content transition-all">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-content">Tinjauan Asesi</h1>
          <p class="text-[10px] text-brand font-black uppercase tracking-widest mt-1">ID: {{ applicantId }}</p>
        </div>
      </div>
    </template>

    <div v-if="applicant" class="max-w-5xl mx-auto py-8 space-y-10">
      <!-- Applicant Info Header -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 p-8 rounded-3xl bg-core-800 border border-core-700 shadow-xl flex items-start gap-6">
          <div class="w-20 h-20 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
            <User class="w-10 h-10" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-content mb-2">{{ applicant.name }}</h2>
            <div class="flex flex-wrap gap-4">
              <div class="flex items-center gap-2 text-content-subtle">
                <FileText class="w-4 h-4" />
                <span class="text-sm">NIK: {{ applicant.nik }}</span>
              </div>
              <div class="px-3 py-1 bg-brand/10 border border-brand/20 rounded-lg text-xs font-black text-brand uppercase tracking-widest">
                {{ applicant.schemeName }}
              </div>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-3xl bg-core-900 border border-core-800 shadow-xl flex flex-col justify-center items-center text-center">
          <span class="text-[10px] font-black text-content-subtle uppercase tracking-widest mb-4">Status Saat Ini</span>
          <div class="px-6 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black text-sm uppercase tracking-widest">
            Menunggu Tinjauan
          </div>
        </div>
      </div>

      <!-- Unit Review Sections -->
      <div class="space-y-8">
        <div class="flex items-center justify-between px-2">
          <h2 class="text-xs font-black uppercase tracking-widest text-content-muted">Daftar Unit Kompetensi (FR.IA.02)</h2>
          <span class="text-[10px] font-black text-brand uppercase tracking-widest bg-brand/5 px-2 py-1 rounded">2 Unit Ditemukan</span>
        </div>

        <ReviewSection 
          v-for="unit in units" 
          :key="unit.id"
          :unit="unit"
          v-model:decisions="decisions"
        />
      </div>

      <!-- Final Action -->
      <div class="p-10 rounded-3xl bg-emerald-500/5 border border-dashed border-emerald-500/30 flex flex-col items-center text-center space-y-6">
        <div class="max-w-md">
          <h3 class="text-lg font-bold text-content mb-2">Rekomendasi Akhir Asesor</h3>
          <p class="text-sm text-content-muted leading-relaxed">
            Pastikan seluruh kriteria unjuk kerja telah dinilai dan bukti-bukti yang dilampirkan asesi telah valid sebelum mengirim rekomendasi.
          </p>
        </div>
        
        <CaButton 
          variant="secondary" 
          @click="submitReview"
          class="bg-emerald-500! hover:bg-emerald-400! h-14 px-10 text-lg shadow-2xl shadow-emerald-500/20"
          :disabled="isSubmitting"
        >
          <CheckCircle2 class="w-6 h-6" />
          {{ isSubmitting ? 'Mengirim...' : 'Kirim Rekomendasi' }}
        </CaButton>
      </div>
    </div>

    <div v-else class="py-40 text-center text-content-muted">
      Data asesi tidak ditemukan.
    </div>
  </DashboardLayout>
</template>
