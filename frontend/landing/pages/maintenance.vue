<template>
    <FallbackState
        :status-label="t('errors.maintenance.statusLabel')"
        :title="t('errors.maintenance.pageTitle')"
        :description="t('errors.maintenance.pageDescription')"
        icon="lucide:rocket"
        :visual-title="t('errors.maintenance.visualTitle')"
        :visual-description="t('errors.maintenance.visualDescription')"
        :highlights="highlights"
        :progress-label="t('errors.maintenance.progressLabel')"
        :progress="82"
        tone="maintenance"
    >
        <template #meta> {{ t('errors.maintenance.estimatedCompletion') }} </template>
    </FallbackState>
</template>

<script setup lang="ts">
const { t } = useCoreI18n()

const highlights = [
    {
        icon: "lucide:cpu",
        label: t('errors.maintenance.highlights.0.label'),
        value: t('errors.maintenance.highlights.0.value'),
    },
    {
        icon: "lucide:activity",
        label: t('errors.maintenance.highlights.1.label'),
        value: t('errors.maintenance.highlights.1.value'),
    },
];

useCoreSeo({
    title: t('errors.maintenance.title') as string,
    description: t('errors.maintenance.description') as string,
    path: "/maintenance",
    noindex: true,
});
</script>
