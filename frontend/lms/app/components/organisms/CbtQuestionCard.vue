<script setup lang="ts">
import { Upload, Eye, FileCheck } from 'lucide-vue-next'
import type { ExamQuestionDomain } from '~/adapters/ExamAdapter'

const props = defineProps<{
    question: ExamQuestionDomain
    modelValue?: any
}>()

const emit = defineEmits(['update:modelValue'])

const onOptionSelect = (optionId: string) => {
    emit('update:modelValue', optionId)
}

const onFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files && target.files[0]) {
        emit('update:modelValue', target.files[0])
    }
}

const uploadedFileName = computed(() => {
    const val = props.modelValue
    if (val instanceof File) return val.name
    return null
})
</script>

<template>
    <div class="space-y-6">
        <div class="p-6 ca-card">
            <div class="flex items-start gap-4 mb-6">
                <span
                    class="shrink-0 w-8 h-8 rounded-full bg-brand/10 border border-brand/20 text-brand flex items-center justify-center font-bold text-xs"
                >
                    {{ question.type === 'upload' ? '↑' : question.type === 'observation' ? '◉' : '?' }}
                </span>
                <div class="flex-1">
                    <h2 class="text-xl font-bold leading-relaxed text-white">{{ question.text }}</h2>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-content-muted mt-1 inline-block">
                        {{ question.points }} poin
                    </span>
                </div>
            </div>

            <!-- Multiple Choice -->
            <div v-if="question.type === 'multiple_choice'" class="grid grid-cols-1 gap-3">
                <button
                    v-for="opt in question.options"
                    :key="opt.id"
                    @click="onOptionSelect(opt.id)"
                    class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group"
                    :class="
                        modelValue === opt.id
                            ? 'border-brand bg-brand/5 shadow-glow-brand'
                            : 'border-white/5 bg-core-900/50 hover:border-brand/30 hover:bg-white/5'
                    "
                >
                    <div
                        class="w-6 h-6 rounded-lg border-2 flex items-center justify-center font-black text-[10px]"
                        :class="
                            modelValue === opt.id
                                ? 'border-brand bg-brand text-slate-950'
                                : 'border-white/10 group-hover:border-brand/50 text-content-subtle'
                        "
                    >
                        {{ opt.label }}
                    </div>
                    <span
                        class="font-medium"
                        :class="modelValue === opt.id ? 'text-white' : 'text-content group-hover:text-white transition-colors'"
                    >
                        {{ opt.value }}
                    </span>
                </button>
            </div>

            <!-- Essay -->
            <div v-else-if="question.type === 'essay'">
                <BaseTextarea
                    id="cbt-essay"
                    placeholder="Tuliskan jawaban Anda di sini..."
                    :model-value="modelValue as string"
                    @update:model-value="(val: string | number) => emit('update:modelValue', String(val))"
                />
            </div>

            <!-- Upload -->
            <div v-else-if="question.type === 'upload'" class="space-y-4">
                <div
                    v-if="uploadedFileName"
                    class="flex items-center gap-4 p-4 rounded-xl bg-brand/5 border border-brand/20"
                >
                    <div class="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                        <FileCheck class="w-5 h-5 text-brand" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-white truncate">{{ uploadedFileName }}</p>
                        <p class="text-[10px] text-content-subtle uppercase font-bold">File berhasil dipilih</p>
                    </div>
                    <button
                        @click="emit('update:modelValue', null)"
                        class="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                    >
                        Hapus
                    </button>
                </div>

                <label v-else class="block cursor-pointer">
                    <input type="file" class="hidden" accept="image/*,.pdf,.doc,.docx" @change="onFileUpload" />
                    <div
                        class="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-white/10 bg-core-900/30 hover:border-brand/30 hover:bg-white/5 transition-all"
                    >
                        <div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                            <Upload class="w-6 h-6 text-content-muted" />
                        </div>
                        <p class="text-sm font-medium text-content-subtle">Klik untuk upload file bukti</p>
                        <p class="text-[10px] text-content-muted">Format: JPG, PNG, PDF, DOC (Maks. 10MB)</p>
                    </div>
                </label>
            </div>

            <!-- Observation -->
            <div v-else-if="question.type === 'observation'" class="space-y-4">
                <div class="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <Eye class="w-5 h-5 text-amber-500 shrink-0" />
                    <p class="text-sm text-amber-300/80">
                        Soal ini akan dinilai langsung oleh asesor melalui observasi. Tidak memerlukan input dari peserta.
                    </p>
                </div>
                <BaseTextarea
                    id="cbt-observation-notes"
                    label="Catatan Peserta (Opsional)"
                    placeholder="Tulis catatan atau pertanyaan untuk asesor jika diperlukan..."
                    :model-value="modelValue as string"
                    @update:model-value="(val: string | number) => emit('update:modelValue', String(val))"
                />
            </div>
        </div>
    </div>
</template>
