<script setup lang="ts">
import { LINKS } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { useReveal, revealRef } = useScrollReveal()
const { t } = useCoreI18n()

const heroText = useReveal('slideLeft')
const heroCard = useReveal('slideRight', 150)
const stepsHeader = useReveal('fadeUp')
const benefitsText = useReveal('slideLeft')
const benefitsChecklist = useReveal('slideRight', 150)
const faqSection = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

useCoreSeo({
    title: t('solutions.venture.title') as string,
    description: t('solutions.venture.description') as string,
    path: '/solutions/venture',
})

useSchemaOrg([
    defineWebPage({
        name: 'Venture Partner Program',
    }),
])
</script>

<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(1000px_420px_at_15%_0%,rgba(16,185,129,0.2),transparent_60%)]"
                />
                <div
                    class="absolute inset-0 bg-[radial-gradient(820px_460px_at_95%_10%,rgba(14,116,144,0.16),transparent_64%)]"
                />
            </div>

            <div class="ca-container relative ca-section pt-6 sm:pt-8 lg:py-28">
                <div class="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
                    <div ref="heroText">
                        <span class="ca-kicker">
                            <Icon
                                name="lucide:handshake"
                                class="h-3.5 w-3.5 text-emerald-300"
                            />
                            {{ t('solutions.venture.kicker') }}
                        </span>
                        <h1
                            class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
                            v-html="t('solutions.venture.hero.title')"
                        />
                        <p class="ca-copy mt-5 max-w-2xl">
                            {{ t('solutions.venture.hero.subtitle') }}
                        </p>

                        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                            <NuxtLink
                                to="/contact?subject=venture"
                                class="ca-btn-primary-emerald"
                            >
                                {{ t('solutions.venture.hero.ctaPrimary') }}
                                <Icon
                                    name="lucide:arrow-right"
                                    class="h-4 w-4"
                                />
                            </NuxtLink>
                            <a
                                :href="LINKS.whatsapp"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="ca-btn-secondary"
                            >
                                {{ t('solutions.venture.hero.ctaSecondary') }}
                            </a>
                        </div>

                        <div class="mt-6 flex flex-wrap gap-2">
                            <span
                                v-for="chip in (t('solutions.venture.hero.chips') as string[])"
                                :key="chip"
                                class="ca-chip"
                            >{{ chip }}</span>
                        </div>
                    </div>

                    <aside ref="heroCard" class="ca-card p-4 sm:p-6">
                        <h2 class="text-lg font-display font-bold text-[var(--ca-text)]">
                            {{ t('solutions.venture.relevance.title') }}
                        </h2>
                        <p class="mt-2 text-sm text-[var(--ca-muted)]">
                            {{ t('solutions.venture.relevance.subtitle') }}
                        </p>

                        <div class="mt-5 grid gap-3">
                            <article
                                class="ca-panel-danger"
                            >
                                <p class="ca-tone-danger text-xs uppercase tracking-[0.14em]">
                                    {{ t('solutions.venture.relevance.buildSelf.label') }}
                                </p>
                                <p class="mt-2 font-display text-2xl font-bold text-[var(--ca-text)]">
                                    {{ t('solutions.venture.relevance.buildSelf.price') }}
                                </p>
                                <p class="mt-1 text-sm ca-tone-danger">
                                    {{ t('solutions.venture.relevance.buildSelf.desc') }}
                                </p>
                            </article>
                            <article
                                class="ca-panel-emerald"
                            >
                                <p class="ca-tone-emerald text-xs uppercase tracking-[0.14em]">
                                    {{ t('solutions.venture.relevance.venture.label') }}
                                </p>
                                <p class="mt-2 font-display text-2xl font-bold text-[var(--ca-text)]">
                                    {{ t('solutions.venture.relevance.venture.price') }}
                                </p>
                                <p class="mt-1 text-sm ca-tone-emerald">
                                    {{ t('solutions.venture.relevance.venture.desc') }}
                                </p>
                            </article>
                        </div>
                    </aside>
                </div>
            </div>
        </section>

        <section class="ca-section pt-4 sm:pt-6">
            <div class="ca-container">
                <div ref="stepsHeader" class="mb-8">
                    <span class="ca-kicker">{{ t('solutions.venture.steps.kicker') }}</span>
                    <h2 class="ca-title mt-4">
                        {{ t('solutions.venture.steps.title') }}
                    </h2>
                </div>

                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article
                        v-for="(step, index) in (t('solutions.venture.steps.items') as any[])"
                        :key="step.title"
                        :ref="revealRef('fadeUp', index * 100)"
                        class="ca-card-soft p-5"
                    >
                        <span
                            class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] text-sm font-bold text-[var(--ca-text)]"
                        >{{ index + 1 }}</span>
                        <h3 class="mt-4 text-base font-display font-semibold text-[var(--ca-text)]">
                            {{ step.title }}
                        </h3>
                        <p class="mt-2 text-sm text-[var(--ca-muted)]">
                            {{ step.description }}
                        </p>
                    </article>
                </div>
            </div>
        </section>

        <section class="ca-section">
            <div class="ca-container">
                <div class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <div ref="benefitsText" class="space-y-4">
                        <span class="ca-kicker">{{ t('solutions.venture.benefits.kicker') }}</span>
                        <h2 class="ca-title">
                            {{ t('solutions.venture.benefits.title') }}
                        </h2>
                        <p class="ca-copy">
                            {{ t('solutions.venture.benefits.subtitle') }}
                        </p>

                        <div class="grid gap-3 sm:grid-cols-2">
                            <article
                                v-for="benefit in (t('solutions.venture.benefits.items') as any[])"
                                :key="benefit.title"
                                class="ca-card-soft p-4"
                            >
                                <div
                                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)]"
                                >
                                    <Icon
                                        :name="benefit.icon"
                                        class="h-4 w-4 text-emerald-300"
                                    />
                                </div>
                                <h3 class="mt-3 text-sm font-semibold text-[var(--ca-text)] sm:text-base">
                                    {{ benefit.title }}
                                </h3>
                                <p class="mt-1 text-sm text-[var(--ca-muted)]">
                                    {{ benefit.description }}
                                </p>
                            </article>
                        </div>
                    </div>

                    <aside ref="benefitsChecklist" class="ca-card p-5 sm:p-6">
                        <p class="text-xs uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
                            {{ t('solutions.venture.partnerFit.label') }}
                        </p>
                        <h3 class="mt-2 text-xl font-display font-bold text-[var(--ca-text)]">
                            {{ t('solutions.venture.partnerFit.title') }}
                        </h3>

                        <ul class="mt-4 space-y-2 text-sm text-[var(--ca-muted)]">
                            <li
                                v-for="item in (t('solutions.venture.partnerFit.requirements') as string[])"
                                :key="item"
                                class="flex items-start gap-2 rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-3 py-2"
                            >
                                <Icon
                                    name="lucide:check-circle-2"
                                    class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300"
                                />
                                <span>{{ item }}</span>
                            </li>
                        </ul>

                        <div class="mt-5 rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4">
                            <p class="text-xs uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
                                {{ t('solutions.venture.partnerFit.targetLabel') }}
                            </p>
                            <p class="mt-2 text-sm text-[var(--ca-text)]">
                                {{ t('solutions.venture.partnerFit.targetDesc') }}
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div ref="faqSection" class="ca-card p-6 sm:p-8">
                    <div class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                        <div>
                            <span class="ca-kicker">{{ t('solutions.venture.faqs.kicker') }}</span>
                            <h2 class="ca-title mt-4">
                                {{ t('solutions.venture.faqs.title') }}
                            </h2>
                        </div>
                        <div class="space-y-3">
                            <article
                                v-for="faq in (t('solutions.venture.faqs.items') as any[])"
                                :key="faq.question"
                                class="rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4"
                            >
                                <h3 class="text-sm font-semibold text-[var(--ca-text)] sm:text-base">
                                    {{ faq.question }}
                                </h3>
                                <p class="mt-2 text-sm text-[var(--ca-muted)]">
                                    {{ faq.answer }}
                                </p>
                            </article>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div ref="ctaSection" class="ca-card p-6 text-center sm:p-10">
                    <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
                        {{ t('solutions.venture.cta.title') }}
                    </h2>
                    <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
                        {{ t('solutions.venture.cta.subtitle') }}
                    </p>
                    <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <NuxtLink to="/contact?subject=venture" class="ca-btn-primary-emerald">
                            {{ t('solutions.venture.cta.ctaPrimary') }}
                        </NuxtLink>
                        <a
                            :href="LINKS.whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary"
                        >
                            {{ t('solutions.venture.cta.ctaSecondary') }}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
