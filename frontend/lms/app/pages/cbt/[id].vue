<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CbtQuestionCard from '~/components/organisms/CbtQuestionCard.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import ConfirmDialog from '~/components/molecules/ConfirmDialog.vue'
import AntiCheatWarning from '~/components/molecules/AntiCheatWarning.vue'
import { ChevronLeft, ChevronRight, Send, LayoutGrid } from 'lucide-vue-next'
import { useCbtEngine } from '~/composables/useCbtEngine'
import { useAntiCheat } from '~/composables/useAntiCheat'

const route = useRoute()
const examId = computed(() => String(route.params.id))

// CBT Engine
const {
    currentExam,
    currentIndex,
    answers,
    timeRemainingSeconds,
    loading,
    submitting,
    error,
    currentQuestion,
    totalQuestions,
    progressPercentage,
    answeredCount,
    isFirstQuestion,
    isLastQuestion,
    fetchAndStart,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    submitExam,
    destroy,
} = useCbtEngine()

// Anti-Cheat
const { cheatAttempts, maxCheatAttempts, isUserCheating, mountAntiCheat, unmountAntiCheat } = useAntiCheat()
const showCheatWarning = ref(false)

// Timer formatting (uses engine's timeRemainingSeconds directly)
const formattedTime = computed(() => {
    const h = Math.floor(timeRemainingSeconds.value / 3600)
    const m = Math.floor((timeRemainingSeconds.value % 3600) / 60)
    const s = timeRemainingSeconds.value % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

const isUrgent = computed(() => timeRemainingSeconds.value < 300)

// Submit confirmation
const showSubmitConfirm = ref(false)
const showNavigator = ref(false)

const handleSubmitConfirm = () => {
    showSubmitConfirm.value = false
    submitExam()
}

// Watch for anti-cheat violations to show warning modal
watch(cheatAttempts, (val) => {
    if (val > 0 && !isUserCheating.value) {
        showCheatWarning.value = true
    }
})

watch(isUserCheating, (val) => {
    if (val) {
        showCheatWarning.value = false
        submitExam()
    }
})

onMounted(async () => {
    mountAntiCheat()
    await fetchAndStart(examId.value)
})

onUnmounted(() => {
    unmountAntiCheat()
    destroy()
})
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div v-if="currentExam">
                    <h1 class="text-xl font-bold text-white">{{ currentExam.title }}</h1>
                    <p class="text-xs text-brand font-medium uppercase tracking-wider">{{ currentExam.id }}</p>
                </div>
                <div v-else class="h-12" />

                <div class="flex items-center gap-4">
                    <!-- Answered count -->
                    <div v-if="currentExam" class="hidden sm:flex flex-col items-end">
                        <span class="text-[10px] uppercase font-black text-content-muted tracking-widest">Dijawab</span>
                        <span class="text-sm font-bold text-white">{{ answeredCount }}/{{ totalQuestions }}</span>
                    </div>

                    <!-- Timer (inline, driven by engine) -->
                    <div
                        v-if="currentExam"
                        class="flex items-center gap-3 px-4 py-2 rounded-xl font-mono text-lg font-bold transition-colors"
                        :class="isUrgent ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-brand/10 text-brand'"
                    >
                        <span>{{ formattedTime }}</span>
                    </div>
                </div>
            </div>
        </template>

        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" label="Memuat soal ujian..." />
        </div>

        <!-- Error State -->
        <div v-else-if="error && !currentExam" class="max-w-lg mx-auto mt-20">
            <ErrorAlert :message="error" :dismissable="false" />
            <div class="mt-6 text-center">
                <CaButton variant="outline" @click="fetchAndStart(examId)">Coba Lagi</CaButton>
            </div>
        </div>

        <!-- Exam Content -->
        <div v-else-if="currentExam && currentQuestion" class="max-w-4xl mx-auto space-y-8">
            <!-- Submission error -->
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <!-- Progress Bar -->
            <div class="space-y-2">
                <div class="flex justify-between text-xs font-black uppercase tracking-widest text-content-subtle">
                    <span>Progres Ujian</span>
                    <div class="flex items-center gap-4">
                        <span>Soal {{ currentIndex + 1 }} dari {{ totalQuestions }}</span>
                        <button
                            @click="showNavigator = !showNavigator"
                            class="p-1 rounded-lg hover:bg-white/5 transition-colors"
                            title="Navigasi Soal"
                        >
                            <LayoutGrid class="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div class="h-1.5 w-full bg-core-800 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-brand transition-all duration-500 ease-out"
                        :style="{ width: `${progressPercentage}%` }"
                    />
                </div>
            </div>

            <!-- Question Navigator Grid -->
            <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
            >
                <div v-if="showNavigator" class="p-4 ca-card">
                    <p class="text-xs font-bold uppercase tracking-widest text-content-subtle mb-3">Navigasi Soal</p>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="(q, i) in currentExam.questions"
                            :key="q.id"
                            @click="jumpToQuestion(i); showNavigator = false"
                            class="w-10 h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                            :class="[
                                i === currentIndex
                                    ? 'bg-brand text-slate-950'
                                    : answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ''
                                        ? 'bg-brand/20 text-brand border border-brand/30'
                                        : 'bg-white/5 text-content-subtle hover:bg-white/10',
                            ]"
                        >
                            {{ i + 1 }}
                        </button>
                    </div>
                </div>
            </Transition>

            <!-- Question -->
            <CbtQuestionCard
                :question="currentQuestion"
                v-model="answers[currentQuestion.id]"
            />

            <!-- Navigation -->
            <div class="flex items-center justify-between pt-4 mt-8 border-t border-white/5">
                <CaButton
                    variant="outline"
                    @click="prevQuestion"
                    :disabled="isFirstQuestion"
                >
                    <ChevronLeft class="w-4 h-4 mr-1" />
                    Sebelumnya
                </CaButton>

                <div class="flex gap-4">
                    <CaButton
                        v-if="!isLastQuestion"
                        variant="primary"
                        @click="nextQuestion"
                    >
                        Selanjutnya
                        <ChevronRight class="w-4 h-4 ml-1" />
                    </CaButton>

                    <CaButton
                        v-else
                        variant="primary"
                        :loading="submitting"
                        @click="showSubmitConfirm = true"
                    >
                        Selesaikan Ujian
                        <Send class="w-4 h-4 ml-1" />
                    </CaButton>
                </div>
            </div>
        </div>

        <!-- Submit Confirmation Dialog -->
        <ConfirmDialog
            :open="showSubmitConfirm"
            title="Selesaikan Ujian?"
            :message="`Anda telah menjawab ${answeredCount} dari ${totalQuestions} soal. Jawaban yang belum diisi akan dianggap kosong. Lanjutkan?`"
            confirm-label="Ya, Selesaikan"
            cancel-label="Kembali ke Soal"
            variant="warning"
            :loading="submitting"
            @confirm="handleSubmitConfirm"
            @cancel="showSubmitConfirm = false"
        />

        <!-- Anti-Cheat Warning Modal -->
        <AntiCheatWarning
            :visible="showCheatWarning"
            :attempts="cheatAttempts"
            :max-attempts="maxCheatAttempts"
            @acknowledge="showCheatWarning = false"
        />
    </DashboardLayout>
</template>
