<script setup lang="ts">
import { LINKS } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { t } = useCoreI18n()
const { useReveal } = useScrollReveal()

const ctaSection = useReveal('scaleUp')
const featuredProducts = computed(() => ((t('home.products.items') as Array<Record<string, any>>) || []).slice(0, 3))

useCoreSeo({
    title: t('home.title') as string,
    description: t('home.description') as string,
    path: '/',
})

useSchemaOrg([
    defineWebPage({
        name: 'CoreAsia Product Ecosystem',
    }),
    defineOrganization({
        name: 'CoreAsia Teknologi',
        url: 'https://coreasia.id',
        logo: 'https://coreasia.id/logos/logo-512.webp',
    }),
])
</script>

<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(1000px_460px_at_20%_0%,rgba(251,191,36,0.14),transparent_62%)]"
                />
                <div
                    class="absolute inset-0 bg-[radial-gradient(900px_440px_at_90%_15%,rgba(16,185,129,0.1),transparent_64%)]"
                />

                <ClientOnly>
                    <ThreeHeroScene />
                    <template #fallback>
                        <div class="absolute inset-0 z-0">
                            <div class="ca-scene-grid absolute inset-0"></div>
                            <div class="ca-scene-glow ca-light-soft-blend absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"></div>
                            <div class="ca-scene-base absolute inset-0 -z-10" />
                        </div>
                    </template>
                </ClientOnly>
            </div>

            <div class="ca-container relative ca-section lg:py-28">
                <div class="mx-auto max-w-4xl text-center">
                    <span class="ca-kicker animate-fade-in-up min-h-[32px]">
                        <Icon
                            name="lucide:sparkles"
                            class="h-3.5 w-3.5 ca-tone-gold"
                        />
                        <TypewriterEffect :text="t('home.kicker')" />
                    </span>

                    <h1
                        class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.6rem] animate-fade-in-up delay-100"
                        v-html="t('home.hero.title')"
                    />

                    <p
                        class="ca-copy mx-auto mt-5 max-w-2xl animate-fade-in-up delay-200"
                        v-html="t('home.hero.subtitle')"
                    />

                    <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up delay-300">
                        <NuxtLink to="/contact" class="ca-btn-primary">
                            {{ t('home.hero.ctaPrimary') }}
                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                        </NuxtLink>
                        <a
                            :href="LINKS.whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary"
                        >
                            <Icon name="lucide:message-circle" class="h-4 w-4" />
                            {{ t('home.hero.ctaSecondary') }}
                        </a>
                    </div>

                    <div class="mt-6 animate-fade-in-up delay-350">
                        <p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ca-subtle)]">
                            {{ t('home.products.kicker') }}
                        </p>
                        <div class="mt-3 grid gap-3 text-left sm:grid-cols-3">
                            <NuxtLink
                                v-for="(product, index) in featuredProducts"
                                :key="product.name"
                                :to="product.to"
                                class="ca-card-soft group rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)]"
                            >
                                <div class="flex items-start justify-between gap-3">
                                    <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
                                        <Icon
                                            :name="index === 0 ? 'lucide:graduation-cap' : index === 1 ? 'lucide:bar-chart-3' : 'lucide:briefcase-business'"
                                            class="h-4.5 w-4.5"
                                            :class="index === 1 ? 'ca-tone-emerald' : 'ca-tone-gold'"
                                        />
                                    </div>
                                    <span class="ca-pill-gold px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em]">
                                        {{ product.badge }}
                                    </span>
                                </div>

                                <h3 class="mt-4 text-base font-display font-semibold text-[var(--ca-text)]">
                                    {{ product.name }}
                                </h3>
                                <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                                    {{ product.description }}
                                </p>

                                <span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold ca-tone-gold">
                                    {{ product.ctaLabel }}
                                    <Icon name="lucide:arrow-right" class="h-4 w-4 transition group-hover:translate-x-0.5" />
                                </span>
                            </NuxtLink>
                        </div>
                    </div>

                    <p class="mt-4 text-xs font-medium text-[var(--ca-subtle)] animate-fade-in delay-400">
                        <Icon name="lucide:shield-check" class="mr-1 inline-block h-3 w-3 ca-tone-emerald" />
                        {{ t('home.hero.powerStatement') }}
                    </p>

                    <div class="mt-8 flex flex-wrap items-center justify-center gap-2 animate-fade-in delay-500">
                        <span
                            v-for="chip in t('home.hero.chips')"
                            :key="chip"
                            class="ca-chip"
                        >
                            {{ chip }}
                        </span>
                    </div>
                </div>
            </div>
        </section>

        <HomeEcosystem />

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div
                    ref="ctaSection"
                    class="ca-card p-6 text-center sm:p-10"
                >
                    <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
                        {{ t('home.readyCTA.title') }}
                    </h2>
                    <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
                        {{ t('home.readyCTA.subtitle') }}
                    </p>
                    <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <NuxtLink
                            to="/contact"
                            class="ca-btn-primary"
                        >
                            {{ t('home.readyCTA.ctaPrimary') }}
                        </NuxtLink>
                        <a
                            :href="LINKS.whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary"
                        >
                            {{ t('home.readyCTA.ctaSecondary') }}
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <!-- <LazyTrustedBy /> -->
    </div>
</template>
