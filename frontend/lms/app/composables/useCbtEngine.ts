import { ref, computed } from 'vue'
import { ExamAdapter, type ExamDomain, type ExamQuestionDomain, type ExamDTO } from '~/adapters/ExamAdapter'
import { coreApi } from '~/services/api/CoreApiService'

/**
 * useCbtEngine
 * Core logical state machine for the Computer-Based Testing environment.
 * Handles timer, auto-save, exam navigation, and API integration.
 */
export const useCbtEngine = () => {
    const currentExam = ref<ExamDomain | null>(null)
    const currentIndex = ref<number>(0)
    const answers = ref<Record<string, any>>({})

    // Timer State
    const timeRemainingSeconds = ref<number>(0)
    const isTimeUp = ref<boolean>(false)
    let timerInterval: ReturnType<typeof setInterval> | null = null

    // Loading & Error states
    const loading = ref(false)
    const submitting = ref(false)
    const error = ref<string | null>(null)

    // Computed Properties for UI
    const currentQuestion = computed<ExamQuestionDomain | null>(() => {
        if (!currentExam.value) return null
        return currentExam.value.questions[currentIndex.value] || null
    })

    const totalQuestions = computed(() => currentExam.value?.questions?.length || 0)

    const progressPercentage = computed(() => {
        if (!totalQuestions.value) return 0
        return ((currentIndex.value + 1) / totalQuestions.value) * 100
    })

    const answeredCount = computed(() => {
        return Object.values(answers.value).filter(a => a !== null && a !== undefined && a !== '').length
    })

    const isFirstQuestion = computed(() => currentIndex.value === 0)
    const isLastQuestion = computed(() => {
        if (!currentExam.value) return true
        return currentIndex.value === currentExam.value.questions.length - 1
    })

    /**
     * Fetch exam from API and initialize session
     */
    const fetchAndStart = async (examId: string) => {
        loading.value = true
        error.value = null
        try {
            const dto = await coreApi.get<ExamDTO>(`/exams/${examId}`)
            const exam = ExamAdapter.toDomain(dto)
            startExam(exam)
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat soal ujian'
            console.error('[CBT Engine] Failed to fetch exam:', e)
        } finally {
            loading.value = false
        }
    }

    /**
     * Initialize a new exam session
     */
    const startExam = (exam: ExamDomain) => {
        currentExam.value = exam
        currentIndex.value = 0
        answers.value = {}
        timeRemainingSeconds.value = exam.durationMinutes * 60
        isTimeUp.value = false

        if (timerInterval) clearInterval(timerInterval)
        timerInterval = setInterval(() => {
            if (timeRemainingSeconds.value > 0) {
                timeRemainingSeconds.value--

                // Auto-save every 30 seconds
                if (timeRemainingSeconds.value % 30 === 0) {
                    triggerAutoSave()
                }
            } else {
                triggerTimeUp()
            }
        }, 1000)
    }

    /**
     * Navigation methods
     */
    const nextQuestion = () => {
        if (!isLastQuestion.value) currentIndex.value++
    }

    const prevQuestion = () => {
        if (!isFirstQuestion.value) currentIndex.value--
    }

    const jumpToQuestion = (index: number) => {
        if (currentExam.value && index >= 0 && index < currentExam.value.questions.length) {
            currentIndex.value = index
        }
    }

    /**
     * Sync answers to backend
     */
    const triggerAutoSave = async () => {
        if (!currentExam.value) return
        try {
            await coreApi.post('/exams/sync', {
                examId: currentExam.value.id,
                answers: answers.value,
            })
        } catch (e) {
            console.warn('[CBT Auto-Save] Sync failed, will retry:', e)
        }
    }

    const triggerTimeUp = () => {
        if (timerInterval) clearInterval(timerInterval)
        isTimeUp.value = true
        submitExam()
    }

    const submitExam = async () => {
        if (timerInterval) clearInterval(timerInterval)
        submitting.value = true
        error.value = null

        try {
            await coreApi.post('/exams/submit', {
                examId: currentExam.value?.id,
                answers: answers.value,
                remainingTime: timeRemainingSeconds.value,
            })
            navigateTo('/assessee')
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal mengirim jawaban'
            console.error('[CBT Final Submission] Failed:', e)
        } finally {
            submitting.value = false
        }
    }

    /**
     * Cleanup timer on component unmount
     */
    const destroy = () => {
        if (timerInterval) {
            clearInterval(timerInterval)
            timerInterval = null
        }
    }

    return {
        // State
        currentExam,
        currentIndex,
        answers,
        timeRemainingSeconds,
        isTimeUp,
        loading,
        submitting,
        error,

        // Computed
        currentQuestion,
        totalQuestions,
        progressPercentage,
        answeredCount,
        isFirstQuestion,
        isLastQuestion,

        // Actions
        fetchAndStart,
        startExam,
        nextQuestion,
        prevQuestion,
        jumpToQuestion,
        submitExam,
        destroy,
    }
}
