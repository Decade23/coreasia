<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CaInputSearch from '~/components/molecules/CaInputSearch.vue'
import CaSelect from '~/components/molecules/CaSelect.vue'
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

const { t } = useI18n()

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
    { value: '', label: t('admin.questions.filterAllSchemes') },
    ...schemes.value.map(s => ({ value: s.id, label: s.name })),
])

const typeSelectOptions = computed(() => [
    { value: '', label: t('admin.questions.filterAllTypes') },
    { value: 'multiple_choice', label: t('admin.questions.types.multiple_choice') },
    { value: 'essay', label: t('admin.questions.types.essay') },
    { value: 'upload', label: t('admin.questions.types.upload') },
    { value: 'observation', label: t('admin.questions.types.observation') },
])

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
            <h1 class="text-lg font-bold text-content hidden lg:block">{{ t('admin.questions.title') }}</h1>
        </template>

        <div class="py-6 space-y-6">
            <div class="space-y-4">
                <Breadcrumb :items="[{ label: 'Admin', to: '/admin' }, { label: t('admin.questions.title') }]" />
                <PageHeader :title="t('admin.questions.title')" :subtitle="t('admin.questions.subtitle')">
                    <template #actions>
                        <div class="hidden lg:block w-64 xl:w-80">
                            <CaInputSearch v-model="searchQuery" :placeholder="t('admin.questions.searchPlaceholder')" />
                        </div>
                        <CaButton variant="primary" @click="handleCreate">
                            <Plus class="w-4 h-4 mr-2" />
                            <span class="hidden sm:inline">{{ t('admin.questions.newQuestion') }}</span>
                        </CaButton>
                    </template>
                </PageHeader>
            </div>

            <!-- Mobile Search & Filters -->
            <div class="flex flex-col lg:hidden gap-4">
                <CaInputSearch v-model="searchQuery" :placeholder="t('admin.questions.searchPlaceholder')" />
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
                <LoadingSpinner size="lg" :label="t('admin.questions.loadingQuestions')" />
            </div>

            <!-- Empty State -->
            <EmptyState
                v-else-if="questions.length === 0 && !loading"
                :title="t('admin.questions.empty')"
                :description="t('admin.questions.emptyDesc')"
            >
                <template #action>
                    <CaButton variant="primary" @click="handleCreate">
                        <Plus class="w-4 h-4 mr-2" />
                        {{ t('admin.questions.newQuestion') }}
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
                            class="ca-action-link px-3 py-1.5 rounded-lg hover:bg-tint-hover"
                            @click="handleEdit(q)"
                        >
                            {{ t('common.edit') }}
                        </button>
                        <button
                            class="ca-action-link-danger px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                            @click="handleDeleteClick(q)"
                        >
                            {{ t('common.delete') }}
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
            :title="t('admin.questions.deleteTitle')"
            :message="t('admin.questions.deleteMessage')"
            :confirm-label="t('common.delete')"
            :loading="saving"
            @confirm="handleConfirmDelete"
            @cancel="showDeleteConfirm = false"
        />
    </DashboardLayout>
</template>
