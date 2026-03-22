<script setup lang="ts">
import { ref, watch } from 'vue'
import CaButton from '~/components/atoms/CaButton.vue'
import BaseTextarea from '~/components/atoms/BaseTextarea.vue'
import { CheckCircle, XCircle, RotateCcw, User, BookOpen } from 'lucide-vue-next'
import type { QualityReviewDomain } from '~/types/quality'

const props = defineProps<{
    review: QualityReviewDomain
    saving?: boolean
    statusColor: string
    statusLabel: string
    recommendationColor: string
    recommendationLabel: string
}>()

const emit = defineEmits<{
    (e: 'approve', id: string, notes: string): void
    (e: 'reject', id: string, notes: string): void
    (e: 'revision', id: string, notes: string): void
}>()

const { t, locale } = useI18n()

const managerNotes = ref(props.review.managerNotes || '')
const showActions = ref(false)

const isPending = props.review.status === 'pending_review'

watch(
    () => props.review,
    (review) => {
        managerNotes.value = review.managerNotes || ''
        showActions.value = false
    },
)

const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}
</script>

<template>
    <div class="ca-card p-0 overflow-hidden">
        <div class="border-b border-divider p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div class="mb-1 flex items-center gap-2">
                        <span class="font-mono text-xs text-brand">{{ review.id }}</span>
                        <span
                            class="rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
                            :class="statusColor"
                        >
                            {{ statusLabel }}
                        </span>
                    </div>
                    <h3 class="text-lg font-bold text-content">{{ review.assesseeName }}</h3>
                </div>

                <span
                    class="self-start rounded-lg border px-3 py-1 text-xs font-bold"
                    :class="recommendationColor"
                >
                    {{ recommendationLabel }}
                </span>
            </div>
        </div>

        <div class="space-y-4 p-5">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="flex items-start gap-3">
                    <User class="mt-0.5 h-4 w-4 shrink-0 text-content-subtle" />
                    <div>
                        <p class="text-xs text-content-subtle">{{ t('admin.qualityReviews.assessor') }}</p>
                        <p class="text-sm font-bold text-content">{{ review.assessorName }}</p>
                    </div>
                </div>

                <div class="flex items-start gap-3">
                    <BookOpen class="mt-0.5 h-4 w-4 shrink-0 text-content-subtle" />
                    <div>
                        <p class="text-xs text-content-subtle">{{ t('admin.qualityReviews.scheme') }}</p>
                        <p class="text-sm font-bold text-content">{{ review.schemeName }}</p>
                    </div>
                </div>
            </div>

            <div class="rounded-xl border border-divider bg-tint p-3">
                <p class="mb-1 text-xs font-bold uppercase tracking-widest text-content-subtle">
                    {{ t('admin.qualityReviews.assessorNotes') }}
                </p>
                <p class="text-sm leading-relaxed text-content-muted">{{ review.assessorNotes }}</p>
            </div>

            <div v-if="review.managerNotes && !isPending" class="rounded-xl border border-brand/10 bg-brand/5 p-3">
                <p class="mb-1 text-xs font-bold uppercase tracking-widest text-brand/70">
                    {{ t('admin.qualityReviews.managerNotes') }}
                </p>
                <p class="text-sm leading-relaxed text-content-muted">{{ review.managerNotes }}</p>
            </div>

            <template v-if="isPending">
                <div v-if="!showActions" class="pt-2">
                    <CaButton variant="primary" class="w-full" @click="showActions = true">
                        {{ t('admin.qualityReviews.decision') }}
                    </CaButton>
                </div>

                <div v-else class="space-y-4 pt-2">
                    <BaseTextarea
                        id="quality-manager-notes"
                        :label="t('admin.qualityReviews.managerNotes')"
                        v-model="managerNotes"
                        :placeholder="t('admin.qualityReviews.managerNotesPlaceholder')"
                        :rows="3"
                    />

                    <div class="flex flex-wrap gap-3">
                        <CaButton
                            variant="primary"
                            :loading="saving"
                            class="min-w-[120px] flex-1"
                            @click="emit('approve', review.id, managerNotes)"
                        >
                            <CheckCircle class="mr-1.5 h-4 w-4" />
                            {{ t('admin.qualityReviews.approve') }}
                        </CaButton>

                        <CaButton
                            variant="outline"
                            :loading="saving"
                            class="min-w-[120px] flex-1"
                            @click="emit('revision', review.id, managerNotes)"
                        >
                            <RotateCcw class="mr-1.5 h-4 w-4" />
                            {{ t('admin.qualityReviews.revision') }}
                        </CaButton>

                        <CaButton
                            variant="outline"
                            :loading="saving"
                            class="min-w-[120px] flex-1 !border-red-500/30 !text-red-400 hover:!bg-red-500/10"
                            @click="emit('reject', review.id, managerNotes)"
                        >
                            <XCircle class="mr-1.5 h-4 w-4" />
                            {{ t('admin.qualityReviews.reject') }}
                        </CaButton>
                    </div>
                </div>
            </template>
        </div>

        <div class="flex items-center justify-between border-t border-divider px-5 py-3">
            <span class="text-xs text-content-subtle">
                {{ t('admin.qualityReviews.submittedAt') }}: {{ formatDate(review.submittedAt) }}
            </span>

            <span v-if="review.reviewedAt" class="text-xs text-content-subtle">
                {{ t('admin.qualityReviews.reviewedAt') }}: {{ formatDate(review.reviewedAt) }}
            </span>
        </div>
    </div>
</template>
