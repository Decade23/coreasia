<template>
    <NuxtLayout name="default">
        <FallbackState
            :status-label="activeState.statusLabel"
            :title="activeState.pageTitle"
            :description="activeState.pageDescription"
            :icon="activeState.icon"
            :visual-title="activeState.visualTitle"
            :visual-description="activeState.visualDescription"
            :highlights="activeState.highlights"
            :progress-label="activeState.progressLabel"
            :progress="activeState.progress"
            :tone="activeState.tone"
        >
            <template #actions>
                <button
                    v-if="isNotFound"
                    type="button"
                    class="ca-btn-primary"
                    @click="goHome"
                >
                    {{ t('errors.notFound.backToHome') }}
                </button>
                <template v-else>
                    <button
                        type="button"
                        class="ca-btn-primary"
                        @click="reloadPage"
                    >
                        {{ t('errors.serverError.reload') }}
                    </button>
                    <NuxtLink to="/contact" class="ca-btn-secondary">
                        {{ t('errors.serverError.contactSupport') }}
                    </NuxtLink>
                </template>
            </template>

            <template #meta>
                <div class="mt-4 text-left">
                    <span class="mb-2 block text-[var(--ca-muted)]">
                        {{ metaLabel }}
                        <strong class="text-[var(--ca-text)]">{{ statusCode }}</strong>
                    </span>
                </div>
            </template>
        </FallbackState>
    </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import { useCoreI18n } from '~/composables/useCoreI18n'

interface FallbackHighlight {
    icon: string
    label: string
    value: string
}

interface FallbackStatePayload {
    statusLabel: string
    pageTitle: string
    pageDescription: string
    icon: string
    visualTitle: string
    visualDescription: string
    highlights: FallbackHighlight[]
    progressLabel: string
    progress: number
    tone: 'warning' | 'danger'
}

const props = defineProps<{
    error: NuxtError
}>()

const { locale, t } = useCoreI18n()

const statusCode = computed(() => Number(props.error?.statusCode || 500))
const isNotFound = computed(() => statusCode.value === 404)

const state404 = computed<FallbackStatePayload>(() => ({
    statusLabel: t('errors.notFound.statusLabel') as string,
    pageTitle: t('errors.notFound.pageTitle') as string,
    pageDescription: t('errors.notFound.pageDescription') as string,
    icon: 'lucide:map-pin',
    visualTitle: t('errors.notFound.visualTitle') as string,
    visualDescription: t('errors.notFound.visualDescription') as string,
    highlights: (t('errors.notFound.highlights') as FallbackHighlight[]) || [],
    progressLabel: t('errors.notFound.progressLabel') as string,
    progress: 32,
    tone: 'warning',
}))

const state500 = computed<FallbackStatePayload>(() => ({
    statusLabel: t('errors.serverError.statusLabel') as string,
    pageTitle: t('errors.serverError.pageTitle') as string,
    pageDescription: t('errors.serverError.pageDescription') as string,
    icon: 'lucide:server-crash',
    visualTitle: t('errors.serverError.visualTitle') as string,
    visualDescription: t('errors.serverError.visualDescription') as string,
    highlights: (t('errors.serverError.highlights') as FallbackHighlight[]) || [],
    progressLabel: t('errors.serverError.progressLabel') as string,
    progress: 68,
    tone: 'danger',
}))

const activeState = computed(() => (isNotFound.value ? state404.value : state500.value))
const metaLabel = computed(() => t('errors.metaLabel') as string)

useSeoMeta({
    title: computed(() => activeState.value.pageTitle),
    description: computed(() => activeState.value.pageDescription),
    robots: 'noindex, nofollow',
    googlebot: 'noindex, nofollow',
})

const goHome = () => {
    clearError({ redirect: '/' })
}

const reloadPage = () => {
    if (process.client) {
        window.location.reload()
        return
    }

    clearError({ redirect: '/' })
}
</script>
