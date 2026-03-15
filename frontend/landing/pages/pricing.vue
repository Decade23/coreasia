<script setup lang="ts">
import { useCoreI18n } from '~/composables/useCoreI18n'
import { useGatewayApi } from '~/composables/useGatewayApi'
import type { PricingPlan } from '~/composables/useGatewayApi'

const { t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()
const { fetchPlans } = useGatewayApi()

const heroKicker = useReveal('fadeUp', 0)
const heroTitle = useReveal('fadeUp', 100)
const heroCopy = useReveal('fadeUp', 200)
const faqSection = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

useCoreSeo({
    title: t('pricing.title') as string,
    description: t('pricing.description') as string,
    path: '/pricing',
})

useSchemaOrg([
    defineWebPage({
        name: t('pricing.schema.name') as string,
        description: t('pricing.schema.description') as string,
    }),
])

const plans = ref<PricingPlan[]>([])
const faqs = computed(() => (t('pricing.faq.items') as Array<{ question: string; answer: string }>) || [])

onMounted(async () => {
    plans.value = await fetchPlans()
})
</script>

<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(920px_420px_at_50%_0%,rgba(251,191,36,0.15),transparent_62%)]"
                />
            </div>

            <div class="ca-container relative ca-section pb-10 text-center sm:pb-12 lg:pb-16">
                <span ref="heroKicker" class="ca-kicker">
                    <Icon name="lucide:sparkles" class="h-3.5 w-3.5 text-amber-300" />
                    {{ t('pricing.kicker') }}
                </span>
                <h1
                    ref="heroTitle"
                    class="mx-auto mt-5 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.4rem]"
                    v-html="t('pricing.hero.title')"
                />
                <p ref="heroCopy" class="ca-copy mx-auto mt-5 max-w-2xl">
                    {{ t('pricing.hero.subtitle') }}
                </p>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-start">
                    <article
                        v-for="(plan, i) in plans"
                        :key="plan.id"
                        :ref="revealRef('fadeUp', i * 120)"
                        class="relative rounded-2xl border p-6 backdrop-blur transition-all duration-300 sm:p-8"
                        :class="[
                            plan.popular
                                ? 'border-amber-400/40 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),var(--ca-card-to))] shadow-[0_18px_60px_rgba(245,158,11,0.15)]'
                                : 'border-[color:var(--ca-border)] bg-[linear-gradient(180deg,var(--ca-card-from),var(--ca-card-to))] shadow-[0_18px_60px_rgba(2,6,23,0.42)] hover:border-amber-300/20',
                        ]"
                    >
                        <div
                            v-if="plan.popular"
                            class="absolute -top-3.5 left-1/2 -translate-x-1/2"
                        >
                            <span
                                class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-lg"
                            >
                                <Icon name="lucide:crown" class="h-3.5 w-3.5" />
                                {{ plan.badge }}
                            </span>
                        </div>

                        <div class="mb-6">
                            <h3 class="text-lg font-display font-bold text-[var(--ca-text)]">
                                {{ plan.name }}
                            </h3>

                            <span
                                v-if="plan.id === 'starter'"
                                class="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200"
                            >
                                <Icon name="lucide:gift" class="h-3 w-3" />
                                {{ plan.badge }}
                            </span>

                            <span
                                v-if="plan.id === 'enterprise'"
                                class="mt-2 inline-flex items-center gap-1 rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-200"
                            >
                                <Icon name="lucide:building-2" class="h-3 w-3" />
                                {{ plan.badge }}
                            </span>

                            <div class="mt-4 flex items-baseline gap-1">
                                <span
                                    class="font-display text-4xl font-bold tracking-tight"
                                    :class="plan.popular ? 'text-amber-200' : 'text-[var(--ca-text)]'"
                                >
                                    {{ plan.priceLabel }}
                                </span>
                                <span class="text-sm text-[var(--ca-subtle)]">{{ plan.period }}</span>
                            </div>
                        </div>

                        <div
                            class="mb-6 h-px"
                            :class="plan.popular ? 'bg-amber-400/20' : 'bg-[color:var(--ca-border)]'"
                        />

                        <ul class="mb-8 space-y-3">
                            <li
                                v-for="feature in plan.features"
                                :key="feature.label"
                                class="flex items-center gap-3 text-sm"
                            >
                                <span
                                    v-if="feature.included"
                                    class="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15"
                                >
                                    <Icon
                                        name="lucide:check"
                                        class="h-3.5 w-3.5 text-emerald-300"
                                    />
                                </span>
                                <span
                                    v-else
                                    class="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--ca-panel-bg)]"
                                >
                                    <Icon
                                        name="lucide:minus"
                                        class="h-3.5 w-3.5 text-[var(--ca-subtle)]"
                                    />
                                </span>
                                <span
                                    :class="feature.included ? 'text-[var(--ca-muted)]' : 'text-[var(--ca-subtle)]'"
                                >
                                    {{ feature.label }}
                                </span>
                            </li>
                        </ul>

                        <NuxtLink
                            :to="plan.cta.to"
                            class="w-full"
                            :class="[
                                plan.popular
                                    ? 'ca-btn-primary'
                                    : plan.id === 'enterprise'
                                        ? 'ca-btn-secondary'
                                        : 'ca-btn-primary',
                            ]"
                        >
                            {{ plan.cta.label }}
                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                        </NuxtLink>
                    </article>
                </div>

                <p class="mt-8 text-center text-sm text-[var(--ca-subtle)]">
                    <Icon name="lucide:shield-check" class="mr-1 inline h-4 w-4 text-emerald-400" />
                    {{ t('pricing.allPlansInclude') }}
                </p>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div ref="faqSection" class="ca-card p-6 sm:p-8">
                    <div class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                        <div>
                            <span class="ca-kicker">
                                <Icon name="lucide:help-circle" class="h-3.5 w-3.5 text-amber-300" />
                                {{ t('pricing.faq.kicker') }}
                            </span>
                            <h2 class="ca-title mt-4">
                                {{ t('pricing.faq.title') }}
                            </h2>
                            <p class="ca-copy mt-3">
                                {{ t('pricing.faq.intro') }}
                                <NuxtLink
                                    to="/contact"
                                    class="font-semibold text-amber-300 underline decoration-amber-300/30 underline-offset-4 transition hover:decoration-amber-300"
                                >
                                    {{ t('pricing.faq.contactCta') }}
                                </NuxtLink>.
                            </p>
                        </div>
                        <div class="space-y-3">
                            <article
                                v-for="faq in faqs"
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
                        {{ t('pricing.cta.title') }}
                    </h2>
                    <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
                        {{ t('pricing.cta.subtitle') }}
                    </p>
                    <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <NuxtLink to="/register?plan=starter" class="ca-btn-primary">
                            {{ t('pricing.cta.primary') }}
                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                        </NuxtLink>
                        <NuxtLink to="/contact" class="ca-btn-secondary">
                            <Icon name="lucide:message-circle" class="h-4 w-4" />
                            {{ t('pricing.cta.secondary') }}
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
