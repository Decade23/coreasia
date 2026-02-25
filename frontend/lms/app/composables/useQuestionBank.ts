import { ref } from 'vue'
import type { QuestionDomain, QuestionFormData, QuestionListResponseDTO } from '~/types/question'
import { QuestionAdapter } from '~/adapters/QuestionAdapter'
import { coreApi } from '~/services/api/CoreApiService'

export const useQuestionBank = () => {
    const questions = ref<QuestionDomain[]>([])
    const loading = ref(false)
    const saving = ref(false)
    const error = ref<string | null>(null)
    const totalItems = ref(0)
    const currentPage = ref(1)

    const fetchQuestions = async (params: {
        page?: number
        search?: string
        schemeId?: string
        questionType?: string
    } = {}) => {
        loading.value = true
        error.value = null
        try {
            const response = await coreApi.get<QuestionListResponseDTO>('/questions', {
                page: params.page || 1,
                per_page: 10,
                search: params.search || '',
                scheme_id: params.schemeId || '',
                question_type: params.questionType || '',
            })
            questions.value = response.data.map(QuestionAdapter.toDomain)
            totalItems.value = response.total
            currentPage.value = response.page
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memuat bank soal'
            console.error('[useQuestionBank] fetchQuestions:', e)
        } finally {
            loading.value = false
        }
    }

    const createQuestion = async (form: QuestionFormData): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            const dto = QuestionAdapter.toDTO(form)
            await coreApi.post('/questions', dto)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal membuat soal baru'
            console.error('[useQuestionBank] createQuestion:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const updateQuestion = async (id: string, form: QuestionFormData): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            const dto = QuestionAdapter.toDTO(form)
            await coreApi.put(`/questions/${id}`, dto)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal memperbarui soal'
            console.error('[useQuestionBank] updateQuestion:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    const deleteQuestion = async (id: string): Promise<boolean> => {
        saving.value = true
        error.value = null
        try {
            await coreApi.delete(`/questions/${id}`)
            return true
        } catch (e: any) {
            error.value = e?.data?.message || e?.message || 'Gagal menghapus soal'
            console.error('[useQuestionBank] deleteQuestion:', e)
            return false
        } finally {
            saving.value = false
        }
    }

    return {
        questions,
        loading,
        saving,
        error,
        totalItems,
        currentPage,
        fetchQuestions,
        createQuestion,
        updateQuestion,
        deleteQuestion,
    }
}
