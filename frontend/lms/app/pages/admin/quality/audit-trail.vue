<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import AuditLogTable from '~/components/organisms/AuditLogTable.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ArrowLeft, ClipboardList } from 'lucide-vue-next'
import { useQualityManager } from '~/composables/useQualityManager'

const {
    auditLogs, loading, error,
    fetchAuditLogs, getActionIcon,
} = useQualityManager()

onMounted(() => fetchAuditLogs())
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <NuxtLink to="/admin/quality" class="w-10 h-10 rounded-xl bg-tint flex items-center justify-center text-content-subtle hover:text-content hover:bg-tint-hover transition-all shrink-0">
                    <ArrowLeft class="w-5 h-5" />
                </NuxtLink>
                <div>
                    <h1 class="text-xl md:text-3xl font-black tracking-tight text-content">Audit Trail</h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Log lengkap semua aktivitas di dalam sistem.</p>
                </div>
            </div>
        </template>

        <div class="py-6 space-y-6">
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat audit trail..." />
            </div>

            <AuditLogTable
                v-else
                :logs="auditLogs"
                :get-action-icon="getActionIcon"
            />
        </div>
    </DashboardLayout>
</template>
