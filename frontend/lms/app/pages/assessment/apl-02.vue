<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import ConfirmDialog from '~/components/molecules/ConfirmDialog.vue'
const AssessmentUnitCard = defineAsyncComponent(() => import('~/components/organisms/AssessmentUnitCard.vue'))
import CaButton from '~/components/atoms/CaButton.vue'
import { useNotificationStore } from '~/stores/useNotificationStore'

import { Save, CheckCircle2, Send } from 'lucide-vue-next'

const { units } = await useAssessment()
const notificationStore = useNotificationStore()
const allClaims = ref<Record<string, any>>({})
const isSaving = ref(false)
const isSubmitConfirmOpen = ref(false)

const totalKuk = computed(() => {
  if (!units.value) return 0
  return units.value.reduce((acc, unit) => {
    return acc + unit.elements.reduce((elAcc, el) => elAcc + el.criteria.length, 0)
  }, 0)
})

const completedKuk = computed(() => {
  return Object.values(allClaims.value).filter(val => val.status !== null).length
})

const progress = computed(() => (completedKuk.value / totalKuk.value) * 100)

const submitConfirmMessage = computed(() => {
  const incompleteMessage = completedKuk.value < totalKuk.value
    ? 'Beberapa kriteria unjuk kerja belum dinilai. '
    : ''

  return `${incompleteMessage}Apakah Anda yakin ingin mengirim Asesmen Mandiri ini? Data tidak dapat diubah setelah dikirim.`
})

const saveAssessment = () => {
  isSaving.value = true
  setTimeout(() => {
    isSaving.value = false
    notificationStore.success('Asesmen Mandiri telah disimpan sementara.')
  }, 1000)
}

const submitAssessment = () => {
  isSubmitConfirmOpen.value = true
}

const confirmSubmitAssessment = () => {
  isSubmitConfirmOpen.value = false
  notificationStore.success('Asesmen Mandiri berhasil dikirim.')
  navigateTo('/')
}
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="min-w-0 mr-4">
          <h1 class="text-lg md:text-xl font-bold text-content truncate">Asesmen Mandiri (APL-02)</h1>
          <p class="text-[10px] text-brand font-black uppercase tracking-widest mt-1 truncate">Skema: Junior Web Developer</p>
        </div>

        <div class="flex items-center gap-2 md:gap-4 shrink-0">
          <CaButton variant="outline" @click="saveAssessment" :disabled="isSaving" size="sm" class="md:px-4">
            <Save class="w-4 h-4 mr-1 md:mr-0" />
            <span class="hidden md:inline">{{ isSaving ? 'Menyimpan...' : 'Simpan Draft' }}</span>
          </CaButton>
          <CaButton 
            variant="primary" 
            @click="submitAssessment" 
            size="sm"
            class="md:px-4"
          >
            <span class="hidden md:inline">Kirim Asesmen</span>
            <span class="md:hidden">Kirim</span>
            <Send class="w-4 h-4 md:hidden ml-1" />
            <CheckCircle2 class="hidden md:inline w-4 h-4 ml-1" />
          </CaButton>
        </div>
      </div>
    </template>

    <div class="max-w-4xl mx-auto space-y-6 md:space-y-8 py-4 md:py-6">
      <!-- Summary Card -->
      <div class="p-6 ca-card flex flex-col sm:flex-row items-center justify-between gap-6 border-brand/20 shadow-brand-glow">
        <div class="space-y-1 text-center sm:text-left">
          <h2 class="text-content font-bold text-lg">Progres Penilaian</h2>
          <p class="text-content-subtle text-sm">Selesaikan penilaian untuk seluruh unit kompetensi.</p>
        </div>
        
        <div class="flex items-center gap-6">
          <div class="text-center">
            <span class="block text-2xl font-black text-brand">{{ completedKuk || 0 }}/{{ totalKuk || 0 }}</span>
            <span class="text-[10px] text-content-subtle font-black uppercase tracking-widest">Kriteria</span>
          </div>
          <div class="w-32 h-2 bg-core-800 rounded-full overflow-hidden">
            <div 
              class="h-full bg-brand transition-all duration-700"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Unit Cards -->
      <div class="space-y-6">
        <AssessmentUnitCard 
          v-for="unit in units" 
          :key="unit.id"
          :unit="unit"
          v-model:claims="allClaims"
        />
      </div>

      <!-- Bottom Info -->
      <div class="p-6 rounded-2xl bg-core-900/50 border border-dashed border-divider-strong text-center">
        <p class="text-sm text-content-subtle italic">
          Catatan: Pastikan Anda memilih "K" hanya jika Anda benar-benar menguasai kriteria tersebut dan memiliki bukti yang relevan.
        </p>
      </div>
    </div>

    <ConfirmDialog
      :open="isSubmitConfirmOpen"
      title="Kirim Asesmen Mandiri"
      :message="submitConfirmMessage"
      confirm-label="Kirim Asesmen"
      cancel-label="Periksa Lagi"
      :variant="completedKuk < totalKuk ? 'warning' : 'default'"
      @confirm="confirmSubmitAssessment"
      @cancel="isSubmitConfirmOpen = false"
    />
  </DashboardLayout>
</template>
