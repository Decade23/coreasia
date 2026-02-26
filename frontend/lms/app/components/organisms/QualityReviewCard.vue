<script setup lang="ts">
import { ref } from 'vue'
import CaButton from '~/components/atoms/CaButton.vue'
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

const managerNotes = ref(props.review.managerNotes || '')
const showActions = ref(false)

const isPending = props.review.status === 'pending_review'
</script>

<template>
    <div class="ca-card p-0 overflow-hidden">
        <!-- Header -->
        <div class="p-5 border-b border-divider">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-mono text-xs text-brand">{{ review.id }}</span>
                        <span
                            class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border"
                            :class="statusColor"
                        >
                            {{ statusLabel }}
                        </span>
                    </div>
                    <h3 class="text-lg font-bold text-content">{{ review.assesseeName }}</h3>
                </div>
                <span
                    class="px-3 py-1 rounded-lg text-xs font-bold border self-start"
                    :class="recommendationColor"
                >
                    {{ recommendationLabel }}
                </span>
            </div>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex items-start gap-3">
                    <User class="w-4 h-4 text-content-subtle mt-0.5 shrink-0" />
                    <div>
                        <p class="text-xs text-content-subtle">Asesor</p>
                        <p class="text-sm font-bold text-content">{{ review.assessorName }}</p>
                    </div>
                </div>
                <div class="flex items-start gap-3">
                    <BookOpen class="w-4 h-4 text-content-subtle mt-0.5 shrink-0" />
                    <div>
                        <p class="text-xs text-content-subtle">Skema</p>
                        <p class="text-sm font-bold text-content">{{ review.schemeName }}</p>
                    </div>
                </div>
            </div>

            <!-- Assessor Notes -->
            <div class="p-3 rounded-xl bg-tint border border-divider">
                <p class="text-xs font-bold text-content-subtle uppercase tracking-widest mb-1">Catatan Asesor</p>
                <p class="text-sm text-content-muted leading-relaxed">{{ review.assessorNotes }}</p>
            </div>

            <!-- Manager Notes (if already reviewed) -->
            <div v-if="review.managerNotes && !isPending" class="p-3 rounded-xl bg-brand/5 border border-brand/10">
                <p class="text-xs font-bold text-brand/70 uppercase tracking-widest mb-1">Catatan Manajer Mutu</p>
                <p class="text-sm text-content-muted leading-relaxed">{{ review.managerNotes }}</p>
            </div>

            <!-- Action Area (only for pending) -->
            <template v-if="isPending">
                <div v-if="!showActions" class="pt-2">
                    <CaButton variant="primary" class="w-full" @click="showActions = true">
                        Berikan Keputusan
                    </CaButton>
                </div>

                <div v-else class="space-y-4 pt-2">
                    <div>
                        <label class="block text-xs font-bold text-content-subtle uppercase tracking-widest mb-2">
                            Catatan Manajer Mutu
                        </label>
                        <textarea
                            v-model="managerNotes"
                            rows="3"
                            class="w-full rounded-xl bg-tint border border-divider-strong px-4 py-3 text-sm text-content placeholder-content-subtle focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30 transition-all resize-none"
                            placeholder="Tambahkan catatan review..."
                        />
                    </div>

                    <div class="flex flex-wrap gap-3">
                        <CaButton
                            variant="primary"
                            :loading="saving"
                            class="flex-1 min-w-[120px]"
                            @click="emit('approve', review.id, managerNotes)"
                        >
                            <CheckCircle class="w-4 h-4 mr-1.5" />
                            Setujui
                        </CaButton>
                        <CaButton
                            variant="outline"
                            :loading="saving"
                            class="flex-1 min-w-[120px]"
                            @click="emit('revision', review.id, managerNotes)"
                        >
                            <RotateCcw class="w-4 h-4 mr-1.5" />
                            Revisi
                        </CaButton>
                        <CaButton
                            variant="outline"
                            :loading="saving"
                            class="flex-1 min-w-[120px] !border-red-500/30 !text-red-400 hover:!bg-red-500/10"
                            @click="emit('reject', review.id, managerNotes)"
                        >
                            <XCircle class="w-4 h-4 mr-1.5" />
                            Tolak
                        </CaButton>
                    </div>
                </div>
            </template>
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-divider flex items-center justify-between">
            <span class="text-xs text-content-subtle">
                Diajukan: {{ review.submittedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
            </span>
            <span v-if="review.reviewedAt" class="text-xs text-content-subtle">
                Direview: {{ review.reviewedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
            </span>
        </div>
    </div>
</template>
