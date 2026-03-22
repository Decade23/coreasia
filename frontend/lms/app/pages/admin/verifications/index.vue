<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CaInputSearch from '~/components/molecules/CaInputSearch.vue'
import CaSelect from '~/components/molecules/CaSelect.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ChevronRight, ClipboardList, Eye, Clock, CheckCircle2 } from 'lucide-vue-next'
import { useVerifications } from '~/composables/useVerifications'

const { t, locale } = useI18n()

const {
    verifications, summary, loading, error,
    fetchVerifications, fetchSummary, getStatusColor, getStatusLabel,
} = useVerifications()

const searchQuery = ref('')
const statusFilter = ref('')

const statusOptions = computed(() => [
    { value: '', label: t('admin.verifications.statusOptions.all') },
    { value: 'SUBMITTED', label: t('admin.verifications.statusOptions.submitted') },
    { value: 'UNDER_REVIEW', label: t('admin.verifications.statusOptions.underReview') },
    { value: 'REVISION_NEEDED', label: t('admin.verifications.statusOptions.revisionNeeded') },
    { value: 'VERIFIED', label: t('admin.verifications.statusOptions.verified') },
    { value: 'REJECTED', label: t('admin.verifications.statusOptions.rejected') },
])

onMounted(async () => {
    await Promise.all([
        fetchVerifications(),
        fetchSummary(),
    ])
})

watch(statusFilter, () => {
    fetchVerifications({ status: statusFilter.value })
})

const filteredVerifications = computed(() => {
    if (!searchQuery.value) return verifications.value
    const q = searchQuery.value.toLowerCase()
    return verifications.value.filter(v =>
        v.assesseeName.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
    )
})

const formatDate = (date: Date) => {
    const loc = locale.value === 'en' ? 'en-US' : 'id-ID'
    return date.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <h1 class="text-lg font-bold text-content hidden lg:block">{{ t('admin.verifications.title') }}</h1>
        </template>

        <div class="py-6 space-y-6">
            <div class="space-y-4">
                <Breadcrumb :items="[{ label: 'Admin', to: '/admin' }, { label: t('admin.verifications.title') }]" />
                <PageHeader :title="t('admin.verifications.title')" :subtitle="t('admin.verifications.subtitle')" />
            </div>

            <!-- Summary Cards -->
            <div v-if="summary" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="ca-stat-card">
                    <div class="ca-stat-icon bg-brand/10">
                        <ClipboardList class="w-5 h-5 text-brand" />
                    </div>
                    <div class="ca-stat-value">{{ summary.total_queue }}</div>
                    <p class="ca-stat-label">{{ t('admin.verifications.totalQueue') }}</p>
                </div>
                <div class="ca-stat-card">
                    <div class="ca-stat-icon bg-emerald-500/10">
                        <Eye class="w-5 h-5 text-emerald-500" />
                    </div>
                    <div class="ca-stat-value text-emerald-500">{{ summary.needs_review }}</div>
                    <p class="ca-stat-label">{{ t('admin.verifications.needsReview') }}</p>
                </div>
                <div class="ca-stat-card">
                    <div class="ca-stat-icon bg-amber-500/10">
                        <Clock class="w-5 h-5 text-amber-400" />
                    </div>
                    <div class="ca-stat-value text-amber-400">{{ summary.awaiting_revision }}</div>
                    <p class="ca-stat-label">{{ t('admin.verifications.awaitingRevision') }}</p>
                </div>
                <div class="ca-stat-card">
                    <div class="ca-stat-icon bg-brand/10">
                        <CheckCircle2 class="w-5 h-5 text-brand" />
                    </div>
                    <div class="ca-stat-value text-brand">{{ summary.completed_this_month }}</div>
                    <p class="ca-stat-label">{{ t('admin.verifications.completedMonth') }}</p>
                </div>
            </div>

            <!-- Toolbar -->
            <div class="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div class="w-full lg:w-96">
                    <CaInputSearch v-model="searchQuery" :placeholder="t('admin.verifications.searchPlaceholder')" />
                </div>
                <div class="w-full lg:w-auto">
                    <CaSelect
                        id="filter-status"
                        :options="statusOptions"
                        v-model="statusFilter"
                        class="w-full sm:w-56"
                    />
                </div>
            </div>

            <!-- Error -->
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" :label="t('admin.verifications.loadingData')" />
            </div>

            <!-- Table -->
            <div v-else class="ca-card overflow-hidden p-0">
                <div class="overflow-x-auto">
                    <table class="ca-table min-w-220">
                        <thead>
                            <tr>
                                <th class="pl-6">{{ t('admin.verifications.table.regNumber') }}</th>
                                <th>{{ t('admin.verifications.table.assessee') }}</th>
                                <th>{{ t('admin.verifications.table.scheme') }}</th>
                                <th>{{ t('admin.verifications.table.submitDate') }}</th>
                                <th>{{ t('admin.verifications.table.status') }}</th>
                                <th class="pr-6 text-right">{{ t('admin.verifications.table.action') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in filteredVerifications" :key="item.id">
                                <td class="pl-6 font-mono text-xs text-brand">{{ item.id }}</td>
                                <td class="font-bold text-content whitespace-nowrap">{{ item.assesseeName }}</td>
                                <td>{{ item.schemeName }}</td>
                                <td class="whitespace-nowrap">{{ formatDate(item.submittedAt) }}</td>
                                <td>
                                    <span
                                        class="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border whitespace-nowrap inline-block"
                                        :class="getStatusColor(item.status)"
                                    >
                                        {{ getStatusLabel(item.status) }}
                                    </span>
                                </td>
                                <td class="pr-6 text-right">
                                    <NuxtLink :to="`/admin/verifications/${item.id}`">
                                        <CaButton
                                            variant="outline"
                                            size="sm"
                                            class="px-3"
                                            :disabled="item.status === 'DRAFT'"
                                        >
                                            <span class="mr-1">{{ t('admin.verifications.review') }}</span>
                                            <ChevronRight class="w-4 h-4" />
                                        </CaButton>
                                    </NuxtLink>
                                </td>
                            </tr>
                            <tr v-if="filteredVerifications.length === 0">
                                <td colspan="6" class="p-8 text-center text-content-subtle text-sm">
                                    {{ t('admin.verifications.emptyFilter') }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>
