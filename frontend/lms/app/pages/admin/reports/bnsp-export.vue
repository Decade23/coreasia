<script setup lang="ts">
import { reactive, computed } from 'vue'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import CaSelect from '~/components/molecules/CaSelect.vue'
import CaDatePicker from '~/components/organisms/CaDatePicker.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ArrowLeft, FileDown, Check, Download } from 'lucide-vue-next'
import { useReports, type BnspExportParams } from '~/composables/useReports'
import { useSchemes } from '~/composables/useSchemes'

const { exportResult, exporting, error, generateBnspExport } = useReports()
const { schemes, fetchSchemes } = useSchemes()
const { t, locale } = useI18n()

onMounted(() => fetchSchemes(1, ''))

const form = reactive<BnspExportParams>({
    schemeId: '',
    periodStart: '',
    periodEnd: '',
    format: 'xlsx',
})

const schemeOptions = computed(() => [
    { value: '', label: t('admin.reports.allSchemes') },
    ...schemes.value.map((scheme) => ({
        value: scheme.id,
        label: scheme.name,
    })),
])

const formatOptions = computed(() => [
    { value: 'xlsx', label: `XLSX · ${t('admin.reports.xlsx')}` },
    { value: 'csv', label: `CSV · ${t('admin.reports.csv')}` },
    { value: 'pdf', label: `PDF · ${t('admin.reports.pdf')}` },
])

const handleExport = async () => {
    if (!form.periodStart || !form.periodEnd) {
        return
    }

    await generateBnspExport({ ...form })
}

const formatDateTime = (value: string) => {
    return new Date(value).toLocaleString(locale.value === 'en' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <h1 class="hidden text-lg font-bold text-content lg:block">{{ t('nav.reports') }}</h1>
        </template>

        <div class="space-y-6 py-6">
            <div class="space-y-4">
                <Breadcrumb
                    :items="[
                        { label: 'Admin', to: '/admin' },
                        { label: t('admin.reports.breadcrumbReports'), to: '/admin/reports' },
                        { label: t('admin.reports.breadcrumbCurrent') },
                    ]"
                />

                <PageHeader
                    :eyebrow="t('nav.reports')"
                    :title="t('admin.reports.bnspExportTitle')"
                    :subtitle="t('admin.reports.bnspExportSubtitle')"
                >
                    <template #actions>
                        <NuxtLink to="/admin/reports">
                            <CaButton variant="outline">
                                <ArrowLeft class="mr-1.5 h-4 w-4" />
                                {{ t('common.back') }}
                            </CaButton>
                        </NuxtLink>
                    </template>
                </PageHeader>
            </div>

            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div class="ca-card overflow-hidden p-0 lg:col-span-2">
                    <div class="border-b border-divider p-6">
                        <h2 class="text-lg font-bold text-content">{{ t('admin.reports.parameterTitle') }}</h2>
                        <p class="mt-1 text-sm text-content-subtle">{{ t('admin.reports.parameterSubtitle') }}</p>
                    </div>

                    <div class="space-y-5 p-6">
                        <CaSelect
                            id="bnsp-scheme"
                            :label="t('admin.reports.schemeLabel')"
                            :options="schemeOptions"
                            :model-value="form.schemeId"
                            :placeholder="t('admin.reports.schemePlaceholder')"
                            @update:model-value="(value) => { form.schemeId = String(value || '') }"
                        />

                        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <CaDatePicker
                                id="bnsp-period-start"
                                :label="t('admin.reports.periodStart')"
                                :model-value="form.periodStart"
                                :placeholder="t('admin.reports.periodStart')"
                                @update:model-value="(value) => { form.periodStart = String(value || '') }"
                            />

                            <CaDatePicker
                                id="bnsp-period-end"
                                :label="t('admin.reports.periodEnd')"
                                :model-value="form.periodEnd"
                                :placeholder="t('admin.reports.periodEnd')"
                                @update:model-value="(value) => { form.periodEnd = String(value || '') }"
                            />
                        </div>

                        <CaSelect
                            id="bnsp-format"
                            :label="t('admin.reports.formatLabel')"
                            :options="formatOptions"
                            :model-value="form.format"
                            @update:model-value="(value) => { form.format = value as BnspExportParams['format'] }"
                        />
                    </div>

                    <div class="flex justify-end border-t border-divider p-6">
                        <CaButton
                            variant="primary"
                            :loading="exporting"
                            :disabled="!form.periodStart || !form.periodEnd"
                            @click="handleExport"
                        >
                            <FileDown class="mr-1.5 h-4 w-4" />
                            {{ t('admin.reports.generate') }}
                        </CaButton>
                    </div>
                </div>

                <div class="ca-card overflow-hidden p-0">
                    <div class="border-b border-divider p-6">
                        <h2 class="text-sm font-bold uppercase tracking-widest text-content-subtle">
                            {{ t('admin.reports.resultTitle') }}
                        </h2>
                    </div>

                    <div class="p-6">
                        <template v-if="exportResult">
                            <div class="space-y-4 text-center">
                                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                                    <Check class="h-8 w-8 text-emerald-500" />
                                </div>

                                <div>
                                    <h3 class="font-bold text-content">{{ t('admin.reports.successTitle') }}</h3>
                                    <p class="mt-1 text-sm text-content-muted">
                                        {{ t('admin.reports.successRecords', { count: exportResult.recordCount }) }}
                                    </p>
                                </div>

                                <div class="rounded-xl bg-tint p-3 font-mono text-xs text-content-muted break-all">
                                    {{ exportResult.fileName }}
                                </div>

                                <a :href="exportResult.downloadUrl" target="_blank" rel="noopener" class="block">
                                    <CaButton variant="primary" class="w-full justify-center">
                                        <Download class="mr-1.5 h-4 w-4" />
                                        {{ t('admin.reports.downloadFile') }}
                                    </CaButton>
                                </a>

                                <p class="text-[10px] text-content-subtle">
                                    {{ t('admin.reports.generatedAt') }}: {{ formatDateTime(exportResult.generatedAt) }}
                                </p>
                            </div>
                        </template>

                        <template v-else>
                            <div class="py-6 text-center">
                                <FileDown class="mx-auto mb-3 h-10 w-10 text-content-subtle opacity-30" />
                                <p class="text-sm text-content-subtle">{{ t('admin.reports.emptyResult') }}</p>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>
