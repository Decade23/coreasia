<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CbtTimer from '~/components/molecules/CbtTimer.vue'
import CbtQuestionCard from '~/components/organisms/CbtQuestionCard.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { MOCK_EXAM } from '~/types/exam'
import { ChevronLeft, ChevronRight, Send } from 'lucide-vue-next'

const route = useRoute()
const exam = ref(MOCK_EXAM)
const currentIndex = ref(0)
const answers = ref<Record<string, any>>({})

const currentQuestion = computed(() => exam.value.questions[currentIndex.value])
const progress = computed(() => ((currentIndex.value + 1) / exam.value.questions.length) * 100)

const nextQuestion = () => {
  if (currentIndex.value < exam.value.questions.length - 1) {
    currentIndex.value++
  }
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const submitExam = () => {
  if (confirm('Apakah Anda yakin ingin mengakhiri ujian?')) {
    alert('Ujian selesai! Jawaban Anda telah disimpan (simulasi).')
    navigateTo('/')
  }
}
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h1 class="text-xl font-bold text-white">{{ exam.title }}</h1>
          <p class="text-xs text-brand font-medium uppercase tracking-wider">{{ exam.id }}</p>
        </div>
        
        <div class="flex items-center gap-6">
          <div class="flex flex-col items-end">
            <span class="text-[10px] uppercase font-black text-content-muted tracking-widest mb-1">Waktu Tersisa</span>
            <CbtTimer :duration-minutes="exam.durationMinutes" @timeout="submitExam" />
          </div>
        </div>
      </div>
    </template>

    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Progress Bar -->
      <div class="space-y-2">
        <div class="flex justify-between text-xs font-black uppercase tracking-widest text-content-subtle">
          <span>Progres Ujian</span>
          <span>Soal {{ currentIndex + 1 }} dari {{ exam.questions.length }}</span>
        </div>
        <div class="h-1.5 w-full bg-core-800 rounded-full overflow-hidden">
          <div 
            class="h-full bg-brand transition-all duration-500 ease-out"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>

      <!-- Question -->
      <CbtQuestionCard
        v-if="currentQuestion"
        :question="currentQuestion"
        v-model="answers[currentQuestion.id]"
      />

      <!-- Navigation -->
      <div class="flex items-center justify-between pt-4 mt-8 border-t border-white/5">
        <CaButton 
          variant="outline" 
          @click="prevQuestion"
          :disabled="currentIndex === 0"
        >
          <ChevronLeft class="w-4 h-4 mr-1" />
          Sebelumnya
        </CaButton>

        <div class="flex gap-4">
          <CaButton 
            v-if="currentIndex < exam.questions.length - 1"
            variant="primary" 
            @click="nextQuestion"
          >
            Selanjutnya
            <ChevronRight class="w-4 h-4 ml-1" />
          </CaButton>

          <CaButton 
            v-else
            variant="primary" 
            @click="submitExam"
          >
            Selesaikan Ujian
            <Send class="w-4 h-4 ml-1" />
          </CaButton>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
