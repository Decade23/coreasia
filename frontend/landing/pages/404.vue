<template>
    <FallbackState
        :status-label="t('errors.notFound.statusLabel')"
        :title="t('errors.notFound.pageTitle')"
        :description="t('errors.notFound.pageDescription')"
        icon="lucide:map-x"
        :visual-title="t('errors.notFound.visualTitle')"
        :visual-description="t('errors.notFound.visualDescription')"
        :highlights="highlights"
        :progress-label="t('errors.notFound.progressLabel')"
        :progress="32"
        tone="warning"
    >
        <template #actions>
            <NuxtLink to="/" class="ca-btn-primary">
                {{ t('errors.notFound.backToHome') }}
            </NuxtLink>
        </template>
    </FallbackState>
</template>

<script setup lang="ts">
const { t } = useCoreI18n()

const highlights = [
    {
        icon: "lucide:map-pinned",
        label: t('errors.notFound.highlights.0.label'),
        value: t('errors.notFound.highlights.0.value'),
    },
    {
        icon: "lucide:wifi-off",
        label: t('errors.notFound.highlights.1.label'),
        value: t('errors.notFound.highlights.1.value'),
    },
];

useCoreSeo({
    title: t('errors.notFound.title') as string,
    description: t('errors.notFound.description') as string,
    path: "/404",
    noindex: true,
});
</script>
