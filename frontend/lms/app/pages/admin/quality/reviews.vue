<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import QualityReviewCard from '~/components/organisms/QualityReviewCard.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import EmptyState from '~/components/atoms/EmptyState.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ArrowLeft, FileSearch } from 'lucide-vue-next'
import { useQualityManager } from '~/composables/useQualityManager'

const { t } = useI18n()

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
            <h1 class="text-lg font-bold text-content hidden lg:block">{{ t('admin.quality.reviewLink') }}</h1>
        </template>

        <div class="py-6 space-y-6">
            <div class="space-y-4">
                <Breadcrumb :items="[{ label: 'Admin', to: '/admin' }, { label: t('nav.quality'), to: '/admin/quality' }, { label: t('admin.quality.reviewLink') }]" />
                <PageHeader :title="t('admin.quality.reviewLink')" :subtitle="t('admin.quality.reviewLinkDesc', { count: reviews.length })">
                    <template #actions>
                        <NuxtLink to="/admin/quality">
                            <CaButton variant="outline">
                                <ArrowLeft class="mr-1.5 h-4 w-4" />
                                {{ t('common.back') }}
                            </CaButton>
                        </NuxtLink>
                    </template>
                </PageHeader>
            </div>

            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" :label="t('common.loading')" />
            </div>

            <EmptyState
                v-else-if="reviews.length === 0 && !loading"
                :title="t('common.noData')"
                :description="t('common.noData')"
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
