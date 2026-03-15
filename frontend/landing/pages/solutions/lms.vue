<script setup lang="ts">
import { useCoreI18n } from '~/composables/useCoreI18n'
import { LINKS } from '~/utils/constants'

const { t } = useCoreI18n()

useCoreSeo({
    title: t('solutions.lms.title') as string,
    description: t('solutions.lms.description') as string,
    path: '/solutions/lms',
})

const features = computed(() => {
    const raw = t('solutions.lms.detailedFeatures') as Array<Record<string, string>>
    return raw.map((feature) => ({
        title: feature.title,
        description: feature.description,
        icon: feature.icon,
    }))
})
</script>

<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(1000px_420px_at_50%_0%,rgba(251,191,36,0.16),transparent_60%)]"
                />
            </div>

            <div class="ca-container relative ca-section text-center lg:py-28">
                <span class="ca-kicker mb-6 animate-fade-in-up">{{ t('solutions.lms.kicker') }}</span>
                <h1 class="ca-title mx-auto max-w-4xl animate-fade-in-up delay-100">
                    <span v-html="t('solutions.lms.hero.title')" />
                </h1>
                <p class="ca-copy mx-auto mt-6 max-w-2xl animate-fade-in-up delay-200">
                    {{ t('solutions.lms.hero.subtitle') }}
                </p>

                <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row animate-fade-in-up delay-300">
                    <NuxtLink to="/contact?subject=lms" class="ca-btn-primary">
                        {{ t('solutions.lms.hero.ctaPrimary') }}
                        <Icon name="lucide:arrow-right" class="h-4 w-4" />
                    </NuxtLink>
                    <a :href="LINKS.whatsapp" target="_blank" rel="noopener noreferrer" class="ca-btn-secondary">
                        <Icon name="lucide:message-circle" class="h-4 w-4" />
                        {{ t('solutions.lms.hero.ctaSecondary') }}
                    </a>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <article
                        v-for="feature in features"
                        :key="feature.title"
                        class="ca-card p-6 transition hover:border-amber-500/30"
                    >
                        <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300">
                            <Icon :name="feature.icon" class="h-6 w-6" />
                        </div>
                        <h3 class="mb-2 text-lg font-display font-bold text-[var(--ca-text)]">
                            {{ feature.title }}
                        </h3>
                        <p class="text-sm leading-relaxed text-[var(--ca-muted)]">
                            {{ feature.description }}
                        </p>
                    </article>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0 text-center">
            <div class="ca-container">
                <div class="ca-card-soft p-10">
                    <h2 class="text-2xl font-display font-bold text-[var(--ca-text)]">
                        {{ t('solutions.lms.cta.title') }}
                    </h2>
                    <p class="mt-2 text-[var(--ca-muted)]">
                        {{ t('solutions.lms.cta.subtitle') }}
                    </p>
                    <div class="mt-6">
                        <NuxtLink to="/contact?subject=lms" class="ca-btn-primary">
                            {{ t('solutions.lms.cta.button') }}
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
