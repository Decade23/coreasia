<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import CaButton from '~/components/atoms/CaButton.vue'
import CaToggle from '~/components/atoms/CaToggle.vue'
import BaseInput from '~/components/atoms/BaseInput.vue'
import BaseTextarea from '~/components/atoms/BaseTextarea.vue'
import CaSelect from '~/components/molecules/CaSelect.vue'
import Modal from '~/components/organisms/Modal.vue'
import type { QuestionDomain, QuestionFormData, QuestionTypeDomain, DifficultyLevel } from '~/types/question'
import { useFormValidation, required, minLength } from '~/composables/useFormValidation'

const props = defineProps<{
    open: boolean
    question?: QuestionDomain | null
    saving?: boolean
    schemeOptions?: { value: string; label: string }[]
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'submit', data: QuestionFormData): void
}>()

const { t } = useI18n()

const createDefaultOptions = () => [
    { id: 'A', text: '', isCorrect: false },
    { id: 'B', text: '', isCorrect: false },
    { id: 'C', text: '', isCorrect: false },
    { id: 'D', text: '', isCorrect: false },
]

const isEditing = computed(() => !!props.question)

const form = reactive<QuestionFormData>({
    schemeId: '',
    type: 'multiple_choice',
    text: '',
    difficulty: 'medium',
    points: 10,
    isActive: true,
    rubric: '',
    instructions: '',
    options: createDefaultOptions(),
})

const { errors, validate, resetErrors, clearFieldError } = useFormValidation(form, {
    schemeId: [required('Skema')],
    text: [required('Pertanyaan'), minLength('Pertanyaan', 10)],
    points: [required('Poin')],
})

const typeOptions = computed<{ value: QuestionTypeDomain; label: string }[]>(() => [
    { value: 'multiple_choice', label: t('admin.questions.types.multiple_choice') },
    { value: 'essay', label: t('admin.questions.types.essay') },
    { value: 'upload', label: t('admin.questions.types.upload') },
    { value: 'observation', label: t('admin.questions.types.observation') },
])

const difficultyOptions = computed<{ value: DifficultyLevel; label: string }[]>(() => [
    { value: 'easy', label: t('admin.questions.difficulty.easy') },
    { value: 'medium', label: t('admin.questions.difficulty.medium') },
    { value: 'hard', label: t('admin.questions.difficulty.hard') },
])

const showOptions = computed(() => form.type === 'multiple_choice')
const showRubric = computed(() => form.type === 'essay')
const showInstructions = computed(() => form.type === 'upload' || form.type === 'observation')

watch(
    () => props.open,
    (isOpen) => {
        if (!isOpen) {
            return
        }

        if (props.question) {
            form.schemeId = props.question.schemeId
            form.type = props.question.type
            form.text = props.question.text
            form.difficulty = props.question.difficulty
            form.points = props.question.points
            form.isActive = props.question.isActive
            form.rubric = props.question.rubric || ''
            form.instructions = props.question.instructions || ''
            form.options = props.question.options.length > 0
                ? props.question.options.map((option) => ({ ...option }))
                : createDefaultOptions()
        } else {
            form.schemeId = ''
            form.type = 'multiple_choice'
            form.text = ''
            form.difficulty = 'medium'
            form.points = 10
            form.isActive = true
            form.rubric = ''
            form.instructions = ''
            form.options = createDefaultOptions()
        }

        resetErrors()
    },
)

const addOption = () => {
    const nextId = String.fromCharCode(65 + form.options.length)
    form.options.push({ id: nextId, text: '', isCorrect: false })
}

const removeOption = (index: number) => {
    if (form.options.length <= 2) {
        return
    }

    form.options.splice(index, 1)
}

const setCorrectAnswer = (index: number) => {
    form.options.forEach((option, optionIndex) => {
        option.isCorrect = optionIndex === index
    })
}

const handleSubmit = () => {
    if (!validate()) {
        return
    }

    emit('submit', {
        ...form,
        points: Number(form.points),
        options: form.options.map((option) => ({ ...option })),
    })
}
</script>

<template>
    <Modal :open="open" max-width="2xl" @close="emit('close')">
        <template #header>
            <div>
                <h2 class="text-xl font-bold text-content">
                    {{ isEditing ? t('admin.questions.modalEditTitle') : t('admin.questions.modalCreateTitle') }}
                </h2>
            </div>
        </template>

        <div class="space-y-5">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                    <CaSelect
                        id="q-scheme"
                        :label="t('admin.questions.schemeLabel')"
                        :options="schemeOptions || []"
                        :model-value="form.schemeId"
                        :placeholder="t('admin.questions.schemePlaceholder')"
                        @update:model-value="(value) => { form.schemeId = String(value || ''); clearFieldError('schemeId') }"
                    />
                    <p v-if="errors.schemeId" class="mt-2 text-xs font-bold text-rose-500">{{ errors.schemeId }}</p>
                </div>

                <CaSelect
                    id="q-type"
                    :label="t('admin.questions.typeLabel')"
                    :options="typeOptions"
                    :model-value="form.type"
                    @update:model-value="(value) => { form.type = value as QuestionTypeDomain }"
                />
            </div>

            <BaseTextarea
                id="q-text"
                :label="t('admin.questions.questionLabel')"
                v-model="form.text"
                :placeholder="t('admin.questions.questionPlaceholder')"
                required
                :error="errors.text"
                @update:model-value="clearFieldError('text')"
            />

            <div v-if="showOptions" class="space-y-3">
                <div class="flex items-center justify-between">
                    <label class="text-xs font-black uppercase tracking-wider text-content-subtle">
                        {{ t('admin.questions.optionsLabel') }}
                    </label>

                    <button
                        v-if="form.options.length < 6"
                        type="button"
                        class="flex items-center gap-1 text-xs font-bold text-brand transition-colors hover:text-brand/80"
                        @click="addOption"
                    >
                        <Plus class="h-3.5 w-3.5" /> {{ t('admin.questions.addOption') }}
                    </button>
                </div>

                <div
                    v-for="(option, index) in form.options"
                    :key="option.id"
                    class="group flex items-start gap-3 rounded-2xl border border-divider bg-tint-subtle p-3"
                >
                    <button
                        type="button"
                        class="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black transition-all"
                        :class="option.isCorrect ? 'border-brand bg-brand/20 text-brand' : 'border-divider-strong text-content-subtle hover:border-brand/40'"
                        :title="option.isCorrect ? t('admin.questions.correctAnswer') : t('admin.questions.correctAnswerHint')"
                        @click="setCorrectAnswer(index)"
                    >
                        {{ option.id }}
                    </button>

                    <BaseInput
                        :id="`q-option-${option.id}`"
                        v-model="option.text"
                        :placeholder="t('admin.questions.optionPlaceholder', { id: option.id })"
                    />

                    <button
                        v-if="form.options.length > 2"
                        type="button"
                        class="mt-2 flex h-8 w-8 items-center justify-center rounded-lg text-content-subtle opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                        @click="removeOption(index)"
                    >
                        <Trash2 class="h-4 w-4" />
                    </button>
                </div>
            </div>

            <BaseTextarea
                v-if="showRubric"
                id="q-rubric"
                :label="t('admin.questions.rubricLabel')"
                v-model="form.rubric"
                :placeholder="t('admin.questions.rubricPlaceholder')"
            />

            <BaseTextarea
                v-if="showInstructions"
                id="q-instructions"
                :label="t('admin.questions.instructionsLabel')"
                v-model="form.instructions"
                :placeholder="form.type === 'upload' ? t('admin.questions.uploadInstructionsPlaceholder') : t('admin.questions.observationInstructionsPlaceholder')"
            />

            <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
                <CaSelect
                    id="q-difficulty"
                    :label="t('admin.questions.difficultyLabel')"
                    :options="difficultyOptions"
                    :model-value="form.difficulty"
                    @update:model-value="(value) => { form.difficulty = value as DifficultyLevel }"
                />

                <BaseInput
                    id="q-points"
                    :label="t('admin.questions.pointsLabel')"
                    type="number"
                    v-model="form.points"
                    required
                    :error="errors.points"
                    @update:model-value="clearFieldError('points')"
                />

                <div class="flex items-end">
                    <div class="w-full rounded-xl border border-divider bg-tint px-4 py-3.5">
                        <CaToggle
                            id="q-active"
                            v-model="form.isActive"
                            :label="t('admin.questions.activeLabel')"
                        />
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex items-center justify-end gap-3">
                <CaButton variant="outline" :disabled="saving" @click="emit('close')">
                    {{ t('common.cancel') }}
                </CaButton>
                <CaButton variant="primary" :loading="saving" @click="handleSubmit">
                    {{ isEditing ? t('admin.questions.saveEdit') : t('admin.questions.save') }}
                </CaButton>
            </div>
        </template>
    </Modal>
</template>
