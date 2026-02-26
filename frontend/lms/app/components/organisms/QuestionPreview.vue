<script setup lang="ts">
import { HelpCircle, FileText, UploadCloud, Eye } from 'lucide-vue-next'
import BaseBadge from '~/components/atoms/BaseBadge.vue'
import type { QuestionDomain } from '~/types/question'

defineProps<{
    question: QuestionDomain
}>()

const typeIcon = (type: string) => {
    switch (type) {
        case 'multiple_choice': return HelpCircle
        case 'essay': return FileText
        case 'upload': return UploadCloud
        case 'observation': return Eye
        default: return HelpCircle
    }
}

const typeLabel = (type: string) => {
    switch (type) {
        case 'multiple_choice': return 'Pilihan Ganda'
        case 'essay': return 'Esai'
        case 'upload': return 'Upload Bukti'
        case 'observation': return 'Observasi'
        default: return type
    }
}

const difficultyLabel = (d: string) => {
    switch (d) {
        case 'easy': return 'Mudah'
        case 'medium': return 'Sedang'
        case 'hard': return 'Sulit'
        default: return d
    }
}

const difficultyColor = (d: string) => {
    switch (d) {
        case 'easy': return 'text-brand'
        case 'medium': return 'text-brand-secondary'
        case 'hard': return 'text-red-400'
        default: return 'text-content-subtle'
    }
}
</script>

<template>
    <div class="ca-card group flex flex-col md:flex-row md:items-start gap-6 relative overflow-hidden p-6 hover:border-brand/30">
        <!-- Glow -->
        <div class="absolute top-0 right-0 w-32 h-64 bg-brand/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <!-- Icon -->
        <div class="w-12 h-12 shrink-0 rounded-xl bg-tint border border-divider-strong flex items-center justify-center text-brand group-hover:border-brand/30 transition-colors z-10">
            <component :is="typeIcon(question.type)" class="w-5 h-5" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 z-10">
            <div class="flex flex-wrap items-center gap-2 mb-3">
                <BaseBadge :text="question.schemeName" variant="default" type="solid" class="bg-tint-strong" />
                <BaseBadge :text="typeLabel(question.type)" variant="default" type="outline" class="border border-divider-strong text-content-subtle" />
                <span
                    class="px-2 py-0.5 text-[10px] uppercase font-black tracking-widest"
                    :class="difficultyColor(question.difficulty)"
                >
                    {{ difficultyLabel(question.difficulty) }}
                </span>
            </div>
            <p class="text-content font-medium text-sm md:text-base leading-relaxed group-hover:text-brand-100 transition-colors">
                {{ question.text }}
            </p>

            <!-- MC Options preview -->
            <div v-if="question.type === 'multiple_choice' && question.options.length > 0" class="mt-3 space-y-1.5">
                <div
                    v-for="opt in question.options"
                    :key="opt.id"
                    class="flex items-center gap-2 text-xs"
                    :class="opt.isCorrect ? 'text-brand font-bold' : 'text-content-subtle'"
                >
                    <span class="w-5 h-5 rounded-full border text-[10px] font-black flex items-center justify-center shrink-0"
                        :class="opt.isCorrect ? 'border-brand bg-brand/20' : 'border-divider-strong'">
                        {{ opt.id }}
                    </span>
                    {{ opt.text }}
                </div>
            </div>

            <!-- Points -->
            <div class="mt-3 text-xs text-content-subtle">
                {{ question.points }} poin
            </div>
        </div>

        <!-- Status & Actions slot -->
        <div class="flex md:flex-col items-center gap-4 shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-divider-strong w-full md:w-auto justify-between md:justify-start z-10">
            <BaseBadge
                :text="question.isActive ? 'Aktif' : 'Draft'"
                :variant="question.isActive ? 'success' : 'default'"
                class="order-2 md:order-1"
            />
            <div class="flex gap-2 order-1 md:order-2">
                <slot name="actions" />
            </div>
        </div>
    </div>
</template>
