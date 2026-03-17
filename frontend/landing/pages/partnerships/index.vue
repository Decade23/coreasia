<script setup lang="ts">
import { LINKS } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()

const heroText = useReveal('slideLeft')
const heroAside = useReveal('slideRight', 150)
const principlesHeader = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

const engagementModels = computed(() => (t('home.engagementModels.items') as Array<Record<string, any>>) || [])
const principles = computed(() => (t('partnershipsPage.principles.items') as Array<Record<string, any>>) || [])

useCoreSeo({
    title: t('partnershipsPage.title') as string,
    description: t('partnershipsPage.description') as string,
    path: '/partnerships',
})

useSchemaOrg([
    defineWebPage({
        name: t('partnershipsPage.title') as string,
        description: t('partnershipsPage.description') as string,
    }),
])
</script>

<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(980px_420px_at_15%_0%,rgba(16,185,129,0.18),transparent_60%)]"
                />
                <div
                    class="absolute inset-0 bg-[radial-gradient(860px_460px_at_100%_12%,rgba(14,116,144,0.12),transparent_66%)]"
                />
            </div>

            <div class="ca-container relative ca-section pt-0 sm:pt-0 lg:py-28">
                <div class="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div ref="heroText">
                        <span class="ca-kicker">
                            <Icon name="lucide:handshake" class="h-3.5 w-3.5 ca-tone-emerald" />
                            {{ t('partnershipsPage.hero.kicker') }}
                        </span>
                        <h1
                            class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
                            v-html="t('partnershipsPage.hero.title')"
                        />
                        <p class="ca-copy mt-5 max-w-2xl">
                            {{ t('partnershipsPage.hero.subtitle') }}
                        </p>

                        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                            <NuxtLink to="/contact" class="ca-btn-primary-emerald">
                                {{ t('partnershipsPage.hero.ctaPrimary') }}
                                <Icon name="lucide:arrow-right" class="h-4 w-4" />
                            </NuxtLink>
                            <NuxtLink to="/products" class="ca-btn-secondary">
                                {{ t('partnershipsPage.hero.ctaSecondary') }}
                            </NuxtLink>
                        </div>

                        <div class="mt-6 flex flex-wrap gap-2">
                            <span
                                v-for="chip in (t('partnershipsPage.hero.chips') as string[])"
                                :key="chip"
                                class="ca-chip"
                            >{{ chip }}</span>
                        </div>
                    </div>

                    <aside ref="heroAside" class="ca-card p-5 sm:p-6">
                        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
                            {{ t('home.engagementModels.kicker') }}
                        </p>
                        <h2 class="mt-3 text-2xl font-display font-bold text-[var(--ca-text)]">
                            {{ t('home.engagementModels.title') }}
                        </h2>
                        <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
                            {{ t('home.engagementModels.subtitle') }}
                        </p>

                        <div class="mt-5 space-y-3">
                            <article
                                v-for="model in engagementModels"
                                :key="model.name"
                                class="rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4"
                            >
                                <h3 class="text-sm font-semibold text-[var(--ca-text)] sm:text-base">
                                    {{ model.name }}
                                </h3>
                                <p class="mt-1 text-sm text-[var(--ca-muted)]">
                                    {{ model.description }}
                                </p>
                            </article>
                        </div>
                    </aside>
                </div>
            </div>
        </section>

        <section class="ca-section pt-4 sm:pt-6">
            <div class="ca-container">
                <div ref="principlesHeader" class="mb-8">
                    <span class="ca-kicker">{{ t('partnershipsPage.principles.title') }}</span>
                    <h2 class="ca-title mt-4">
                        {{ t('home.engagementModels.title') }}
                    </h2>
                    <p class="ca-copy mt-3 max-w-3xl">
                        {{ t('home.engagementModels.subtitle') }}
                    </p>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                    <NuxtLink
                        v-for="(model, index) in engagementModels"
                        :key="model.name"
                        :ref="revealRef('fadeUp', index * 100)"
                        :to="model.to"
                        class="ca-card group p-5 transition hover:-translate-y-0.5"
                    >
                        <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
                            <Icon :name="index === 0 ? 'lucide:package-check' : index === 1 ? 'lucide:handshake' : 'lucide:building-2'" class="h-5 w-5 ca-tone-emerald" />
                        </div>

                        <h3 class="mt-5 text-lg font-display font-semibold text-[var(--ca-text)]">
                            {{ model.name }}
                        </h3>
                        <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
                            {{ model.description }}
                        </p>

                        <ul class="mt-4 space-y-2">
                            <li
                                v-for="feature in model.features"
                                :key="feature"
                                class="flex items-start gap-2 text-sm text-[var(--ca-muted)]"
                            >
                                <Icon name="lucide:check-circle-2" class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 ca-tone-emerald" />
                                <span>{{ feature }}</span>
                            </li>
                        </ul>

                        <span class="mt-5 inline-flex items-center gap-1 text-sm font-semibold ca-tone-gold">
                            {{ model.ctaLabel }}
                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                        </span>
                    </NuxtLink>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="grid gap-4 md:grid-cols-3">
                    <article
                        v-for="(item, index) in principles"
                        :key="item.title"
                        :ref="revealRef('fadeUp', index * 100)"
                        class="ca-card-soft p-5"
                    >
                        <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
                            <Icon :name="item.icon" class="h-5 w-5 ca-tone-gold" />
                        </div>
                        <h3 class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]">
                            {{ item.title }}
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                            {{ item.description }}
                        </p>
                    </article>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div ref="ctaSection" class="ca-card p-6 sm:p-8">
                    <div class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <span class="ca-kicker">{{ t('partnershipsPage.hero.kicker') }}</span>
                            <h2 class="ca-title mt-4">
                                {{ t('partnershipsPage.cta.title') }}
                            </h2>
                            <p class="ca-copy mt-3 max-w-3xl">
                                {{ t('partnershipsPage.cta.subtitle') }}
                            </p>
                        </div>

                        <div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
                            <NuxtLink to="/contact" class="ca-btn-primary-emerald">
                                {{ t('partnershipsPage.cta.ctaPrimary') }}
                            </NuxtLink>
                            <a
                                :href="LINKS.whatsapp"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="ca-btn-secondary"
                            >
                                {{ t('partnershipsPage.cta.ctaSecondary') }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
