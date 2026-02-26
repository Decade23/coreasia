<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CaInputSearch from '~/components/molecules/CaInputSearch.vue'
import QuestionPreview from '~/components/organisms/QuestionPreview.vue'
import QuestionFormModal from '~/components/organisms/QuestionFormModal.vue'
import ConfirmDialog from '~/components/molecules/ConfirmDialog.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import EmptyState from '~/components/atoms/EmptyState.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { Plus } from 'lucide-vue-next'
import { useQuestionBank } from '~/composables/useQuestionBank'
import { useSchemes } from '~/composables/useSchemes'
import type { QuestionDomain, QuestionFormData } from '~/types/question'

const {
    questions, loading, saving, error,
    fetchQuestions, createQuestion, updateQuestion, deleteQuestion,
} = useQuestionBank()

const { schemes, fetchSchemes } = useSchemes()

const searchQuery = ref('')
const schemeFilter = ref('')
const typeFilter = ref('')

const showFormModal = ref(false)
const editingQuestion = ref<QuestionDomain | null>(null)
const showDeleteConfirm = ref(false)
const deletingQuestion = ref<QuestionDomain | null>(null)

const schemeSelectOptions = computed(() => [
    { value: '', label: 'Semua Skema' },
    ...schemes.value.map(s => ({ value: s.id, label: s.name })),
])

const typeSelectOptions = [
    { value: '', label: 'Semua Tipe' },
    { value: 'multiple_choice', label: 'Pilihan Ganda' },
    { value: 'essay', label: 'Esai' },
    { value: 'upload', label: 'Upload Bukti' },
    { value: 'observation', label: 'Observasi' },
]

const schemeFormOptions = computed(() =>
    schemes.value.map(s => ({ value: s.id, label: s.name }))
)

onMounted(async () => {
    await Promise.all([
        fetchQuestions(),
        fetchSchemes(),
    ])
})

const doSearch = () => {
    fetchQuestions({
        search: searchQuery.value,
        schemeId: schemeFilter.value,
        questionType: typeFilter.value,
    })
}

let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(doSearch, 300)
})
watch([schemeFilter, typeFilter], doSearch)

const handleCreate = () => {
    editingQuestion.value = null
    showFormModal.value = true
}

const handleEdit = (question: QuestionDomain) => {
    editingQuestion.value = question
    showFormModal.value = true
}

const handleSubmitForm = async (data: QuestionFormData) => {
    let success: boolean
    if (editingQuestion.value) {
        success = await updateQuestion(editingQuestion.value.id, data)
    } else {
        success = await createQuestion(data)
    }
    if (success) {
        showFormModal.value = false
        doSearch()
    }
}

const handleDeleteClick = (question: QuestionDomain) => {
    deletingQuestion.value = question
    showDeleteConfirm.value = true
}

const handleConfirmDelete = async () => {
    if (!deletingQuestion.value) return
    const success = await deleteQuestion(deletingQuestion.value.id)
    if (success) {
        showDeleteConfirm.value = false
        deletingQuestion.value = null
        doSearch()
    }
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div>
                    <h1 class="text-2xl md:text-3xl font-black tracking-tight text-content">Bank Soal</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Kelola perbendaharaan soal ujian untuk seluruh skema.</p>
                </div>

                <div class="flex items-center gap-4 shrink-0">
                    <div class="relative hidden lg:block w-64 xl:w-80">
                        <CaInputSearch v-model="searchQuery" placeholder="Cari konten soal..." />
                    </div>
                    <div class="h-8 w-px bg-tint-strong hidden lg:block" />
                    <CaButton variant="primary" class="rounded-full px-5 py-2 flex items-center gap-2 transition-all hover:scale-105" @click="handleCreate">
                        <Plus class="w-4 h-4" />
                        <span class="hidden sm:inline">Buat Soal</span>
                    </CaButton>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-8">
            <!-- Mobile Search & Filters -->
            <div class="flex flex-col lg:hidden gap-4">
                <CaInputSearch v-model="searchQuery" placeholder="Cari konten soal..." />
                <div class="flex flex-col sm:flex-row gap-3">
                    <CaSelect
                        id="filter-scheme-mobile"
                        :options="schemeSelectOptions"
                        v-model="schemeFilter"
                        class="w-full"
                    />
                    <CaSelect
                        id="filter-type-mobile"
                        :options="typeSelectOptions"
                        v-model="typeFilter"
                        class="w-full"
                    />
                </div>
            </div>

            <!-- Desktop Filters -->
            <div class="hidden lg:flex justify-end gap-3">
                <CaSelect
                    id="filter-scheme"
                    :options="schemeSelectOptions"
                    v-model="schemeFilter"
                    class="w-56"
                />
                <CaSelect
                    id="filter-type"
                    :options="typeSelectOptions"
                    v-model="typeFilter"
                    class="w-48"
                />
            </div>

            <!-- Error -->
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat bank soal..." />
            </div>

            <!-- Empty State -->
            <EmptyState
                v-else-if="questions.length === 0 && !loading"
                title="Belum ada soal"
                description="Mulai dengan membuat soal pertama untuk bank soal Anda."
            >
                <template #action>
                    <CaButton variant="primary" @click="handleCreate">
                        <Plus class="w-4 h-4 mr-2" />
                        Buat Soal
                    </CaButton>
                </template>
            </EmptyState>

            <!-- Question List -->
            <div v-else class="space-y-4">
                <QuestionPreview
                    v-for="q in questions"
                    :key="q.id"
                    :question="q"
                >
                    <template #actions>
                        <button
                            class="text-content-subtle hover:text-content px-3 py-1.5 rounded-lg hover:bg-tint-hover text-xs font-semibold transition-all"
                            @click="handleEdit(q)"
                        >
                            Edit
                        </button>
                        <button
                            class="text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-xs font-semibold transition-all border border-transparent hover:border-red-500/20"
                            @click="handleDeleteClick(q)"
                        >
                            Hapus
                        </button>
                    </template>
                </QuestionPreview>
            </div>
        </div>

        <!-- Form Modal -->
        <QuestionFormModal
            :open="showFormModal"
            :question="editingQuestion"
            :saving="saving"
            :scheme-options="schemeFormOptions"
            @close="showFormModal = false"
            @submit="handleSubmitForm"
        />

        <!-- Delete Confirmation -->
        <ConfirmDialog
            :open="showDeleteConfirm"
            variant="danger"
            title="Hapus Soal"
            message="Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan."
            confirm-label="Hapus"
            :loading="saving"
            @confirm="handleConfirmDelete"
            @cancel="showDeleteConfirm = false"
        />
    </DashboardLayout>
</template>
