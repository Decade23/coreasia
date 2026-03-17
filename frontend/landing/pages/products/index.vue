<script setup lang="ts">
import { LINKS } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()

const heroText = useReveal('slideLeft')
const heroAside = useReveal('slideRight', 150)
const highlightsHeader = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

const products = computed(() => (t('home.products.items') as Array<Record<string, any>>) || [])
const comingSoon = computed(() => (t('home.products.comingSoon') as Array<Record<string, any>>) || [])
const highlights = computed(() => (t('productsPage.highlights.items') as Array<Record<string, any>>) || [])

const productIcons = ['lucide:bar-chart-3', 'lucide:code-2']

useCoreSeo({
    title: t('productsPage.title') as string,
    description: t('productsPage.description') as string,
    path: '/products',
})

useSchemaOrg([
    defineWebPage({
        name: t('productsPage.title') as string,
        description: t('productsPage.description') as string,
    }),
])
</script>

<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(980px_420px_at_15%_0%,rgba(251,191,36,0.16),transparent_60%)]"
                />
                <div
                    class="absolute inset-0 bg-[radial-gradient(880px_460px_at_100%_12%,rgba(14,116,144,0.12),transparent_66%)]"
                />
            </div>

            <div class="ca-container relative ca-section pt-0 sm:pt-0 lg:py-28">
                <div class="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div ref="heroText">
                        <span class="ca-kicker">
                            <Icon name="lucide:boxes" class="h-3.5 w-3.5 ca-tone-gold" />
                            {{ t('productsPage.hero.kicker') }}
                        </span>
                        <h1
                            class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
                            v-html="t('productsPage.hero.title')"
                        />
                        <p class="ca-copy mt-5 max-w-2xl">
                            {{ t('productsPage.hero.subtitle') }}
                        </p>

                        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                            <NuxtLink to="/contact" class="ca-btn-primary">
                                {{ t('productsPage.hero.ctaPrimary') }}
                                <Icon name="lucide:arrow-right" class="h-4 w-4" />
                            </NuxtLink>
                            <NuxtLink to="/pricing" class="ca-btn-secondary">
                                {{ t('productsPage.hero.ctaSecondary') }}
                            </NuxtLink>
                        </div>

                        <div class="mt-6 flex flex-wrap gap-2">
                            <span
                                v-for="chip in (t('productsPage.hero.chips') as string[])"
                                :key="chip"
                                class="ca-chip"
                            >{{ chip }}</span>
                        </div>
                    </div>

                    <aside ref="heroAside" class="ca-card p-5 sm:p-6">
                        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
                            {{ t('home.products.kicker') }}
                        </p>
                        <h2 class="mt-3 text-2xl font-display font-bold text-[var(--ca-text)]">
                            {{ t('home.products.title') }}
                        </h2>
                        <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
                            {{ t('home.products.subtitle') }}
                        </p>

                        <div class="mt-5 space-y-3">
                            <NuxtLink
                                v-for="product in products"
                                :key="product.name"
                                :to="product.to"
                                class="block rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4 transition hover:border-[color:var(--ca-gold)] hover:shadow-sm"
                            >
                                <div class="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 class="text-sm font-semibold text-[var(--ca-text)] sm:text-base">
                                            {{ product.name }}
                                        </h3>
                                        <p class="mt-1 text-sm text-[var(--ca-muted)]">
                                            {{ product.tagline }}
                                        </p>
                                    </div>
                                    <span class="ca-pill-gold px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]">
                                        {{ product.badge }}
                                    </span>
                                </div>
                            </NuxtLink>

                            <div
                                v-for="item in comingSoon"
                                :key="item.name"
                                class="rounded-xl border border-dashed border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4 opacity-60"
                            >
                                <div class="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 class="text-sm font-semibold text-[var(--ca-text)] sm:text-base">
                                            {{ item.name }}
                                        </h3>
                                        <p class="mt-1 text-sm text-[var(--ca-muted)]">
                                            {{ item.tagline }}
                                        </p>
                                    </div>
                                    <span class="shrink-0 rounded-full border border-[color:var(--ca-border)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-muted)]">
                                        {{ item.badge }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </section>

        <section class="ca-section pt-4 sm:pt-6">
            <div class="ca-container">
                <div ref="highlightsHeader" class="mb-8">
                    <span class="ca-kicker">{{ t('productsPage.highlights.title') }}</span>
                    <h2 class="ca-title mt-4">
                        {{ t('home.products.title') }}
                    </h2>
                    <p class="ca-copy mt-3 max-w-3xl">
                        {{ t('home.products.subtitle') }}
                    </p>
                </div>

                <div class="grid gap-6 md:grid-cols-2">
                    <NuxtLink
                        v-for="(product, index) in products"
                        :key="product.name"
                        :ref="revealRef('fadeUp', index * 100)"
                        :to="product.to"
                        class="ca-card-soft group flex flex-col p-6 transition hover:-translate-y-1 hover:border-[color:var(--ca-gold-border)] hover:shadow-lg sm:p-8"
                    >
                        <div class="flex items-center gap-4">
                            <div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
                                <Icon :name="productIcons[index] || 'lucide:box'" class="h-6 w-6 ca-tone-gold" />
                            </div>
                            <div>
                                <h3 class="text-xl font-display font-bold text-[var(--ca-text)]">
                                    {{ product.name }}
                                </h3>
                                <span class="mt-1 inline-block ca-pill-gold px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em]">
                                    {{ product.badge }}
                                </span>
                            </div>
                        </div>

                        <p class="mt-5 text-[0.94rem] leading-relaxed text-[var(--ca-muted)]">
                            {{ product.description }}
                        </p>

                        <ul class="mt-5 flex-1 space-y-2.5">
                            <li
                                v-for="feature in product.features"
                                :key="feature"
                                class="flex items-start gap-2.5 text-sm text-[var(--ca-muted)]"
                            >
                                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 ca-tone-emerald" />
                                <span>{{ feature }}</span>
                            </li>
                        </ul>

                        <span class="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ca-tone-gold group-hover:gap-2.5 transition-all">
                            {{ product.ctaLabel }}
                            <Icon name="lucide:arrow-right" class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </NuxtLink>
                </div>
            </div>
        </section>

        <section v-if="comingSoon.length" class="ca-section pt-0">
            <div class="ca-container">
                <div class="mb-6">
                    <span class="ca-kicker">Coming Soon</span>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                    <article
                        v-for="(item, index) in comingSoon"
                        :key="item.name"
                        :ref="revealRef('fadeUp', index * 100)"
                        class="ca-card p-5 opacity-70"
                    >
                        <div class="flex items-center justify-between gap-3">
                            <h3 class="text-lg font-display font-semibold text-[var(--ca-text)]">
                                {{ item.name }}
                            </h3>
                            <span class="shrink-0 rounded-full border border-[color:var(--ca-border)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-muted)]">
                                {{ item.badge }}
                            </span>
                        </div>
                        <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
                            {{ item.description }}
                        </p>
                    </article>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="grid gap-4 md:grid-cols-3">
                    <article
                        v-for="(item, index) in highlights"
                        :key="item.title"
                        :ref="revealRef('fadeUp', index * 100)"
                        class="ca-card p-5"
                    >
                        <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
                            <Icon :name="item.icon" class="h-5 w-5 ca-tone-emerald" />
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
                            <span class="ca-kicker">{{ t('productsPage.hero.kicker') }}</span>
                            <h2 class="ca-title mt-4">
                                {{ t('productsPage.cta.title') }}
                            </h2>
                            <p class="ca-copy mt-3 max-w-3xl">
                                {{ t('productsPage.cta.subtitle') }}
                            </p>
                        </div>

                        <div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
                            <NuxtLink to="/contact" class="ca-btn-primary">
                                {{ t('productsPage.cta.ctaPrimary') }}
                            </NuxtLink>
                            <a
                                :href="LINKS.whatsapp"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="ca-btn-secondary"
                            >
                                {{ t('productsPage.cta.ctaSecondary') }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
