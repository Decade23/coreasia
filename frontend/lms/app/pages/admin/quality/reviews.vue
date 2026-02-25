<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import QualityReviewCard from '~/components/organisms/QualityReviewCard.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import EmptyState from '~/components/atoms/EmptyState.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ArrowLeft, FileSearch } from 'lucide-vue-next'
import { useQualityManager } from '~/composables/useQualityManager'

const {
    reviews, loading, saving, error,
    fetchReviews, submitReview,
    getReviewStatusColor, getReviewStatusLabel,
    getRecommendationColor, getRecommendationLabel,
} = useQualityManager()

onMounted(() => fetchReviews())

const handleApprove = async (id: string, notes: string) => {
    await submitReview(id, 'approved', notes)
}

const handleReject = async (id: string, notes: string) => {
    await submitReview(id, 'rejected', notes)
}

const handleRevision = async (id: string, notes: string) => {
    await submitReview(id, 'revision_needed', notes)
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <NuxtLink to="/admin/quality" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-content-subtle hover:text-white hover:bg-white/10 transition-all shrink-0">
                    <ArrowLeft class="w-5 h-5" />
                </NuxtLink>
                <div>
                    <h1 class="text-xl md:text-3xl font-black tracking-tight text-white">Review Keputusan Asesor</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Tinjau dan validasi hasil penilaian asesor.</p>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-6">
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat data review..." />
            </div>

            <EmptyState
                v-else-if="reviews.length === 0 && !loading"
                title="Tidak ada review"
                description="Semua keputusan asesor sudah ditinjau."
            >
                <template #icon>
                    <FileSearch class="w-12 h-12 text-content-subtle" />
                </template>
            </EmptyState>

            <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <QualityReviewCard
                    v-for="review in reviews"
                    :key="review.id"
                    :review="review"
                    :saving="saving"
                    :status-color="getReviewStatusColor(review.status)"
                    :status-label="getReviewStatusLabel(review.status)"
                    :recommendation-color="getRecommendationColor(review.recommendation)"
                    :recommendation-label="getRecommendationLabel(review.recommendation)"
                    @approve="handleApprove"
                    @reject="handleReject"
                    @revision="handleRevision"
                />
            </div>
        </div>
    </DashboardLayout>
</template>
