<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import AuditLogTable from '~/components/organisms/AuditLogTable.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ArrowLeft } from 'lucide-vue-next'
import { useQualityManager } from '~/composables/useQualityManager'

const { t } = useI18n()

const {
    auditLogs, loading, error,
    fetchAuditLogs, getActionIcon,
} = useQualityManager()

onMounted(() => fetchAuditLogs())
</script>

<template>
    <DashboardLayout>
        <template #header>
            <h1 class="text-lg font-bold text-content hidden lg:block">{{ t('admin.quality.auditLink') }}</h1>
        </template>

        <div class="py-6 space-y-6">
            <div class="space-y-4">
                <Breadcrumb :items="[{ label: 'Admin', to: '/admin' }, { label: t('nav.quality'), to: '/admin/quality' }, { label: t('admin.quality.auditLink') }]" />
                <PageHeader :title="t('admin.quality.auditLink')" :subtitle="t('admin.quality.auditLinkDesc')">
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

            <AuditLogTable
                v-else
                :logs="auditLogs"
                :get-action-icon="getActionIcon"
            />
        </div>
    </DashboardLayout>
</template>
