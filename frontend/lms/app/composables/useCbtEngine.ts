import { ref, computed } from 'vue'
import type { ExamDomain, ExamQuestionDomain } from '~/adapters/ExamAdapter'

/**
 * useCbtEngine
 * Core logical state machine for the Computer-Based Testing environment.
 * Handles the running timer, auto-saving answers, and exam navigation.
 */
export const useCbtEngine = () => {
    const currentExam = ref<ExamDomain | null>(null)
    const currentIndex = ref<number>(0)

    // Record<questionId, answerValue>
    const answers = ref<Record<string, any>>({})

    // Timer State
    const timeRemainingSeconds = ref<number>(0)
    const isTimeUp = ref<boolean>(false)
    let timerInterval: ReturnType<typeof setInterval> | null = null

    // Computed Properties for UI
    const currentQuestion = computed<ExamQuestionDomain | null>(() => {
        if (!currentExam.value) return null
        return currentExam.value.questions[currentIndex.value] || null
    })

    const progressPercentage = computed(() => {
        if (!currentExam.value?.questions?.length) return 0
        return ((currentIndex.value + 1) / currentExam.value.questions.length) * 100
    })

    const isFirstQuestion = computed(() => currentIndex.value === 0)
    const isLastQuestion = computed(() => {
        if (!currentExam.value) return true
        return currentIndex.value === currentExam.value.questions.length - 1
    })

    /**
     * Initialize a new exam session
     */
    const startExam = (exam: ExamDomain) => {
        currentExam.value = exam
        currentIndex.value = 0
        answers.value = {}
        timeRemainingSeconds.value = exam.durationMinutes * 60
        isTimeUp.value = false

        // Start the countdown
        if (timerInterval) clearInterval(timerInterval)
        timerInterval = setInterval(() => {
            if (timeRemainingSeconds.value > 0) {
                timeRemainingSeconds.value--

                // Auto-save logic triggers every 30 seconds
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
     * Backend Sync Simulation
     */
    const triggerAutoSave = () => {
        console.log('[CBT Auto-Save] Syncing answers to backend...', answers.value)
        // TODO: Connect to CoreApiService.post('/api/exams/sync')
    }

    const triggerTimeUp = () => {
        if (timerInterval) clearInterval(timerInterval)
        isTimeUp.value = true
        console.warn('[CBT Engine] Time is up! Force submitting exam.')
        submitExam()
    }

    const submitExam = () => {
        if (timerInterval) clearInterval(timerInterval)
        console.log('[CBT Final Submission] Payload:', {
            examId: currentExam.value?.id,
            answers: answers.value,
            remainingTime: timeRemainingSeconds.value
        })
        // TODO: Connect to CoreApiService.post('/api/exams/submit')

        // Simulate successful navigation back to dashboard
        navigateTo('/assessee')
    }

    return {
        // State
        currentExam,
        currentIndex,
        answers,
        timeRemainingSeconds,
        isTimeUp,

        // Computed
        currentQuestion,
        progressPercentage,
        isFirstQuestion,
        isLastQuestion,

        // Actions
        startExam,
        nextQuestion,
        prevQuestion,
        jumpToQuestion,
        submitExam
    }
}
