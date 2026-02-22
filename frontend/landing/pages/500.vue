<template>
    <FallbackState
        :status-label="t('errors.serverError.statusLabel')"
        :title="t('errors.serverError.pageTitle')"
        :description="t('errors.serverError.pageDescription')"
        icon="lucide:server-crash"
        :visual-title="t('errors.serverError.visualTitle')"
        :visual-description="t('errors.serverError.visualDescription')"
        :highlights="highlights"
        :progress-label="t('errors.serverError.progressLabel')"
        :progress="68"
        tone="danger"
    >
        <template #actions>
            <button type="button" class="ca-btn-primary" @click="reloadPage">
                {{ t('errors.serverError.reload') }}
            </button>
            <NuxtLink to="/contact" class="ca-btn-secondary">
                {{ t('errors.serverError.contactSupport') }}
            </NuxtLink>
        </template>
    </FallbackState>
</template>

<script setup lang="ts">
const { t } = useCoreI18n()

const highlights = [
    {
        icon: "lucide:wrench",
        label: t('errors.serverError.highlights.0.label'),
        value: t('errors.serverError.highlights.0.value'),
    },
    {
        icon: "lucide:activity",
        label: t('errors.serverError.highlights.1.label'),
        value: t('errors.serverError.highlights.1.value'),
    },
];

const reloadPage = () => {
    if (process.client) {
        window.location.reload();
    }
};

useCoreSeo({
    title: t('errors.serverError.title') as string,
    description: t('errors.serverError.description') as string,
    path: "/500",
    noindex: true,
});
</script>
