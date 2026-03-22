<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { TrendingUp, AlertCircle, CheckCircle2, ClipboardList, FileSearch } from 'lucide-vue-next'
import { useQualityManager } from '~/composables/useQualityManager'

const { t } = useI18n()
const { stats, loading, error, fetchStats } = useQualityManager()

onMounted(() => fetchStats())
</script>

<template>
    <DashboardLayout>
        <template #header>
            <h1 class="text-lg font-bold text-content hidden lg:block">{{ t('admin.quality.title') }}</h1>
        </template>

        <div class="py-6 space-y-6">
            <div class="space-y-4">
                <Breadcrumb :items="[{ label: 'Admin', to: '/admin' }, { label: t('nav.quality'), to: '/admin/quality' }, { label: 'Dashboard' }]" />
                <PageHeader :title="t('admin.quality.title')" :subtitle="t('admin.quality.subtitle')" />
            </div>

            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" :label="t('common.loading')" />
            </div>

            <template v-else-if="stats">
                <!-- Summary Cards -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="ca-stat-card">
                        <div class="ca-stat-icon bg-brand/10">
                            <ClipboardList class="w-5 h-5 text-brand" />
                        </div>
                        <div class="ca-stat-value">{{ stats.totalAssessments }}</div>
                        <p class="ca-stat-label">{{ t('admin.quality.totalAssessments') }}</p>
                    </div>
                    <div class="ca-stat-card">
                        <div class="ca-stat-icon bg-emerald-500/10">
                            <CheckCircle2 class="w-5 h-5 text-emerald-500" />
                        </div>
                        <div class="ca-stat-value text-emerald-500">{{ stats.competentCount }}</div>
                        <p class="ca-stat-label">{{ t('admin.quality.competent') }}</p>
                    </div>
                    <div class="ca-stat-card">
                        <div class="ca-stat-icon bg-brand/10">
                            <TrendingUp class="w-5 h-5 text-brand" />
                        </div>
                        <div class="ca-stat-value text-brand">{{ stats.passRate }}%</div>
                        <p class="ca-stat-label">{{ t('admin.quality.passRate') }}</p>
                    </div>
                    <div class="ca-stat-card">
                        <div class="ca-stat-icon bg-amber-500/10">
                            <AlertCircle class="w-5 h-5 text-amber-400" />
                        </div>
                        <div class="ca-stat-value text-amber-400">{{ stats.pendingReviews }}</div>
                        <p class="ca-stat-label">{{ t('admin.quality.pendingReviews') }}</p>
                    </div>
                </div>

                <!-- Quick Links -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NuxtLink to="/admin/quality/reviews" class="ca-card p-5 flex items-center gap-4 group">
                        <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <FileSearch class="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h3 class="font-bold text-content group-hover:text-brand transition-colors">{{ t('admin.quality.reviewLink') }}</h3>
                            <p class="text-sm text-content-subtle">{{ t('admin.quality.reviewLinkDesc', { count: stats.pendingReviews }) }}</p>
                        </div>
                    </NuxtLink>
                    <NuxtLink to="/admin/quality/audit-trail" class="ca-card p-5 flex items-center gap-4 group">
                        <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                            <ClipboardList class="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 class="font-bold text-content group-hover:text-brand transition-colors">{{ t('admin.quality.auditLink') }}</h3>
                            <p class="text-sm text-content-subtle">{{ t('admin.quality.auditLinkDesc') }}</p>
                        </div>
                    </NuxtLink>
                </div>

                <!-- Scheme Breakdown -->
                <div class="ca-card p-0 overflow-hidden">
                    <div class="p-6 border-b border-divider">
                        <h2 class="text-sm font-bold text-content-subtle uppercase tracking-widest">{{ t('admin.quality.schemeBreakdown') }}</h2>
                    </div>
                    <div class="divide-y divide-divider">
                        <div
                            v-for="scheme in stats.schemeBreakdown"
                            :key="scheme.schemeName"
                            class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-tint transition-colors"
                        >
                            <div class="flex-1 min-w-0">
                                <h3 class="font-bold text-content text-sm">{{ scheme.schemeName }}</h3>
                                <p class="text-xs text-content-subtle mt-0.5">{{ t('admin.quality.competentOf', { competent: scheme.competent, total: scheme.total }) }}</p>
                            </div>
                            <div class="flex items-center gap-4 shrink-0">
                                <div class="w-32 sm:w-48 h-2 rounded-full bg-tint overflow-hidden">
                                    <div
                                        class="h-full rounded-full transition-all duration-500"
                                        :class="scheme.passRate >= 80 ? 'bg-emerald-500' : scheme.passRate >= 60 ? 'bg-amber-500' : 'bg-red-500'"
                                        :style="{ width: `${scheme.passRate}%` }"
                                    />
                                </div>
                                <span
                                    class="text-sm font-bold w-14 text-right"
                                    :class="scheme.passRate >= 80 ? 'text-emerald-500' : scheme.passRate >= 60 ? 'text-amber-400' : 'text-red-400'"
                                >
                                    {{ scheme.passRate }}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </DashboardLayout>
</template>
