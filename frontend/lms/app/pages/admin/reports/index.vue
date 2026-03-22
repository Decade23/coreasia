<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { Award, Users, BookOpen, Layers, FileDown } from 'lucide-vue-next'
import { useReports } from '~/composables/useReports'

const { t } = useI18n()
const { summary, loading, error, fetchSummary } = useReports()

onMounted(() => fetchSummary())
</script>

<template>
    <DashboardLayout>
        <template #header>
            <h1 class="text-lg font-bold text-content hidden lg:block">{{ t('admin.reports.title') }}</h1>
        </template>

        <div class="py-6 space-y-6">
            <div class="space-y-4">
                <Breadcrumb :items="[{ label: 'Admin', to: '/admin' }, { label: t('admin.reports.title') }]" />
                <PageHeader :title="t('admin.reports.title')" :subtitle="t('admin.reports.subtitle')" />
            </div>

            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" :label="t('common.loading')" />
            </div>

            <template v-else-if="summary">
                <!-- Summary Cards -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="ca-stat-card">
                        <div class="ca-stat-icon bg-brand/10">
                            <Award class="w-5 h-5 text-brand" />
                        </div>
                        <div class="ca-stat-value">{{ summary.totalCertificatesIssued }}</div>
                        <p class="ca-stat-label">{{ t('admin.reports.certificatesIssued') }}</p>
                    </div>
                    <div class="ca-stat-card">
                        <div class="ca-stat-icon bg-emerald-500/10">
                            <BookOpen class="w-5 h-5 text-emerald-500" />
                        </div>
                        <div class="ca-stat-value">{{ summary.totalAssessments }}</div>
                        <p class="ca-stat-label">{{ t('admin.reports.totalAssessments') }}</p>
                    </div>
                    <div class="ca-stat-card">
                        <div class="ca-stat-icon bg-purple-500/10">
                            <Users class="w-5 h-5 text-purple-400" />
                        </div>
                        <div class="ca-stat-value">{{ summary.totalAssessees }}</div>
                        <p class="ca-stat-label">{{ t('admin.reports.totalAssessees') }}</p>
                    </div>
                    <div class="ca-stat-card">
                        <div class="ca-stat-icon bg-amber-500/10">
                            <Layers class="w-5 h-5 text-amber-400" />
                        </div>
                        <div class="ca-stat-value">{{ summary.totalSchemes }}</div>
                        <p class="ca-stat-label">{{ t('admin.reports.activeSchemes') }}</p>
                    </div>
                </div>

                <!-- Export Actions -->
                <div class="ca-card p-0 overflow-hidden">
                    <div class="p-6 border-b border-divider">
                        <h2 class="text-lg font-bold text-content">{{ t('admin.reports.exportTitle') }}</h2>
                        <p class="text-sm text-content-subtle mt-1">{{ t('admin.reports.exportSubtitle') }}</p>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <NuxtLink to="/admin/reports/bnsp-export" class="p-5 rounded-xl bg-tint-subtle border border-divider hover:border-brand/20 transition-all group cursor-pointer">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                                        <FileDown class="w-6 h-6 text-brand" />
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-content group-hover:text-brand transition-colors">{{ t('admin.reports.bnspExportCard') }}</h3>
                                        <p class="text-xs text-content-subtle mt-0.5">{{ t('admin.reports.bnspExportCardDesc') }}</p>
                                    </div>
                                </div>
                            </NuxtLink>
                            <div class="p-5 rounded-xl bg-tint-subtle border border-dashed border-divider-strong flex items-center justify-center">
                                <p class="text-sm text-content-subtle text-center">{{ t('admin.reports.comingSoon') }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Period Info -->
                <div class="text-xs text-content-subtle text-center">
                    {{ t('admin.reports.dataPeriod', { start: summary.periodStart, end: summary.periodEnd }) }}
                </div>
            </template>
        </div>
    </DashboardLayout>
</template>
