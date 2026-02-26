<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { X, Plus, Trash2 } from 'lucide-vue-next'
import CaButton from '~/components/atoms/CaButton.vue'
import type { QuestionDomain, QuestionFormData, QuestionOptionDomain, QuestionTypeDomain, DifficultyLevel } from '~/types/question'
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
    options: [
        { id: 'A', text: '', isCorrect: false },
        { id: 'B', text: '', isCorrect: false },
        { id: 'C', text: '', isCorrect: false },
        { id: 'D', text: '', isCorrect: false },
    ],
})

const { errors, validate, resetErrors, clearFieldError } = useFormValidation(form, {
    schemeId: [required('Skema')],
    text: [required('Pertanyaan'), minLength('Pertanyaan', 10)],
    points: [required('Poin')],
})

const typeOptions: { value: QuestionTypeDomain; label: string }[] = [
    { value: 'multiple_choice', label: 'Pilihan Ganda' },
    { value: 'essay', label: 'Esai' },
    { value: 'upload', label: 'Upload Bukti' },
    { value: 'observation', label: 'Observasi' },
]

const difficultyOptions: { value: DifficultyLevel; label: string }[] = [
    { value: 'easy', label: 'Mudah' },
    { value: 'medium', label: 'Sedang' },
    { value: 'hard', label: 'Sulit' },
]

const showOptions = computed(() => form.type === 'multiple_choice')
const showRubric = computed(() => form.type === 'essay')
const showInstructions = computed(() => form.type === 'upload' || form.type === 'observation')

watch(() => props.open, (val) => {
    if (val && props.question) {
        form.schemeId = props.question.schemeId
        form.type = props.question.type
        form.text = props.question.text
        form.difficulty = props.question.difficulty
        form.points = props.question.points
        form.isActive = props.question.isActive
        form.rubric = props.question.rubric || ''
        form.instructions = props.question.instructions || ''
        form.options = props.question.options.length > 0
            ? props.question.options.map(o => ({ ...o }))
            : [
                { id: 'A', text: '', isCorrect: false },
                { id: 'B', text: '', isCorrect: false },
                { id: 'C', text: '', isCorrect: false },
                { id: 'D', text: '', isCorrect: false },
            ]
    } else if (val) {
        form.schemeId = ''
        form.type = 'multiple_choice'
        form.text = ''
        form.difficulty = 'medium'
        form.points = 10
        form.isActive = true
        form.rubric = ''
        form.instructions = ''
        form.options = [
            { id: 'A', text: '', isCorrect: false },
            { id: 'B', text: '', isCorrect: false },
            { id: 'C', text: '', isCorrect: false },
            { id: 'D', text: '', isCorrect: false },
        ]
    }
    resetErrors()
})

const addOption = () => {
    const nextId = String.fromCharCode(65 + form.options.length)
    form.options.push({ id: nextId, text: '', isCorrect: false })
}

const removeOption = (idx: number) => {
    if (form.options.length > 2) {
        form.options.splice(idx, 1)
    }
}

const setCorrectAnswer = (idx: number) => {
    form.options.forEach((opt, i) => {
        opt.isCorrect = i === idx
    })
}

const handleSubmit = () => {
    if (!validate()) return
    emit('submit', { ...form, options: form.options.map(o => ({ ...o })) })
}
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 backdrop-blur-sm" :style="{ background: 'var(--th-overlay)' }" @click="emit('close')" />

                <div class="relative w-full max-w-3xl ca-card p-0 z-10 max-h-[90vh] flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-divider">
                        <h2 class="text-xl font-bold text-content">
                            {{ isEditing ? 'Edit Soal' : 'Buat Soal Baru' }}
                        </h2>
                        <button
                            class="w-10 h-10 rounded-xl bg-tint flex items-center justify-center text-content-subtle hover:text-content hover:bg-tint-hover transition-all"
                            @click="emit('close')"
                        >
                            <X class="w-5 h-5" />
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="p-6 space-y-5 overflow-y-auto flex-1">
                        <!-- Row 1: Scheme + Type -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <CaSelect
                                id="q-scheme"
                                label="Skema Sertifikasi"
                                :options="schemeOptions || []"
                                v-model="form.schemeId"
                                placeholder="Pilih skema..."
                            />
                            <CaSelect
                                id="q-type"
                                label="Tipe Soal"
                                :options="typeOptions"
                                v-model="form.type"
                            />
                        </div>

                        <!-- Question Text -->
                        <BaseTextarea
                            id="q-text"
                            label="Pertanyaan"
                            v-model="form.text"
                            placeholder="Tulis pertanyaan di sini..."
                            required
                            :error="errors.text"
                            @update:model-value="clearFieldError('text')"
                        />

                        <!-- Multiple Choice Options -->
                        <div v-if="showOptions" class="space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="text-xs font-black uppercase tracking-wider text-content-subtle">Pilihan Jawaban</label>
                                <button
                                    v-if="form.options.length < 6"
                                    type="button"
                                    class="text-xs font-bold text-brand hover:text-brand/80 flex items-center gap-1 transition-colors"
                                    @click="addOption"
                                >
                                    <Plus class="w-3.5 h-3.5" /> Tambah
                                </button>
                            </div>
                            <div
                                v-for="(opt, idx) in form.options"
                                :key="idx"
                                class="flex items-center gap-3 group"
                            >
                                <button
                                    type="button"
                                    class="w-8 h-8 rounded-full border-2 shrink-0 flex items-center justify-center text-xs font-black transition-all"
                                    :class="opt.isCorrect
                                        ? 'border-brand bg-brand/20 text-brand'
                                        : 'border-divider-strong text-content-subtle hover:border-brand/40'"
                                    @click="setCorrectAnswer(idx)"
                                    :title="opt.isCorrect ? 'Jawaban benar' : 'Tandai sebagai jawaban benar'"
                                >
                                    {{ opt.id }}
                                </button>
                                <div class="flex-1">
                                    <input
                                        v-model="opt.text"
                                        :placeholder="`Pilihan ${opt.id}`"
                                        class="w-full bg-input rounded-xl px-4 py-3 text-sm text-content font-medium transition-all placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 shadow-inset-light"
                                    />
                                </div>
                                <button
                                    v-if="form.options.length > 2"
                                    type="button"
                                    class="w-8 h-8 rounded-lg flex items-center justify-center text-content-subtle hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                    @click="removeOption(idx)"
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <!-- Essay Rubric -->
                        <BaseTextarea
                            v-if="showRubric"
                            id="q-rubric"
                            label="Rubrik Penilaian"
                            v-model="form.rubric"
                            placeholder="Panduan penilaian untuk asesor..."
                        />

                        <!-- Upload/Observation Instructions -->
                        <BaseTextarea
                            v-if="showInstructions"
                            id="q-instructions"
                            label="Instruksi"
                            v-model="form.instructions"
                            :placeholder="form.type === 'upload' ? 'Format file, ukuran maksimal, dll...' : 'Panduan observasi untuk asesor...'"
                        />

                        <!-- Row 2: Difficulty + Points -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <CaSelect
                                id="q-difficulty"
                                label="Tingkat Kesulitan"
                                :options="difficultyOptions"
                                v-model="form.difficulty"
                            />
                            <BaseInput
                                id="q-points"
                                label="Poin"
                                type="number"
                                v-model="form.points"
                                required
                                :error="errors.points"
                                @update:model-value="clearFieldError('points')"
                            />
                            <div class="flex items-end pb-1">
                                <div class="flex items-center justify-between w-full p-3.5 rounded-xl bg-tint border border-divider">
                                    <span class="text-sm font-bold text-content">Aktif</span>
                                    <button
                                        type="button"
                                        class="relative w-10 h-6 rounded-full transition-colors duration-200"
                                        :class="form.isActive ? 'bg-brand' : 'bg-tint-strong'"
                                        @click="form.isActive = !form.isActive"
                                    >
                                        <span
                                            class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
                                            :class="form.isActive ? 'translate-x-[18px]' : 'translate-x-0.5'"
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-end gap-3 p-6 border-t border-divider">
                        <CaButton variant="outline" :disabled="saving" @click="emit('close')">
                            Batal
                        </CaButton>
                        <CaButton variant="primary" :loading="saving" @click="handleSubmit">
                            {{ isEditing ? 'Simpan Perubahan' : 'Simpan Soal' }}
                        </CaButton>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
