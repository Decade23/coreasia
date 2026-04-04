<script setup lang="ts">
import { LINKS } from '~/utils/constants'

const { t } = useCoreI18n()

useCoreSeo({
  title: t('solutions.pantau.title') as string,
  description: t('solutions.pantau.description') as string,
  path: '/products/pantau',
})

useSchemaOrg([
  defineWebPage({
    name: 'Pantau by CoreAsia',
    description: t('solutions.pantau.description') as string,
  }),
])

// Service schema for rich snippets
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Pantau by CoreAsia',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: t('solutions.pantau.description') as string,
        url: 'https://coreasia.id/products/pantau',
        provider: {
          '@type': 'Organization',
          name: 'CoreAsia Teknologi',
          url: 'https://coreasia.id',
        },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'IDR',
          lowPrice: '0',
          highPrice: '1500000',
          offerCount: 5,
          availability: 'https://schema.org/InStock',
        },
      }),
    },
  ],
})

const features = computed(
  () => (t('solutions.pantau.detailedFeatures') as Array<Record<string, string>>) || [],
)
const audienceItems = computed(
  () => (t('solutions.pantau.audience.items') as Array<Record<string, string>>) || [],
)
const workflowItems = computed(
  () => (t('solutions.pantau.workflow.items') as Array<Record<string, string>>) || [],
)
const pricingPlans = computed(
  () => (t('solutions.pantau.pricing.plans') as Array<Record<string, any>>) || [],
)
</script>

<template>
  <div>
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div
          class="absolute inset-0 bg-[radial-gradient(980px_420px_at_15%_0%,rgba(16,185,129,0.2),transparent_60%)]"
        />
        <div
          class="absolute inset-0 bg-[radial-gradient(880px_460px_at_95%_10%,rgba(14,165,233,0.16),transparent_64%)]"
        />
      </div>

      <div class="ca-container relative ca-section pt-6 sm:pt-8 lg:py-28">
        <div class="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <span class="ca-kicker">
              <Icon name="lucide:bar-chart-3" class="h-3.5 w-3.5 ca-tone-emerald" />
              {{ t('solutions.pantau.kicker') }}
            </span>
            <h1
              class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
              v-html="t('solutions.pantau.hero.title')"
            />
            <p class="ca-copy mt-5 max-w-2xl">
              {{ t('solutions.pantau.hero.subtitle') }}
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="https://pantau.coreasia.id" target="_blank" rel="noopener noreferrer" class="ca-btn-primary-emerald">
                {{ t('solutions.pantau.hero.ctaPrimary') }}
                <Icon name="lucide:arrow-right" class="h-4 w-4" />
              </a>
              <a
                :href="LINKS.whatsapp"
                target="_blank"
                rel="noopener noreferrer"
                class="ca-btn-secondary"
              >
                {{ t('solutions.pantau.hero.ctaSecondary') }}
              </a>
            </div>

            <div class="mt-6 flex flex-wrap gap-2">
              <span
                v-for="chip in (t('solutions.pantau.hero.chips') as string[])"
                :key="chip"
                class="ca-chip"
              >
                {{ chip }}
              </span>
            </div>
          </div>

          <aside class="ca-card p-5 sm:p-6">
            <p class="text-xs uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
              {{ t('solutions.pantau.workflow.label') }}
            </p>
            <h2 class="mt-2 text-xl font-display font-bold text-[var(--ca-text)]">
              {{ t('solutions.pantau.workflow.title') }}
            </h2>

            <div class="mt-5 space-y-3">
              <article
                v-for="item in workflowItems"
                :key="item.title"
                class="rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4"
              >
                <h3 class="text-sm font-semibold text-[var(--ca-text)] sm:text-base">
                  {{ item.title }}
                </h3>
                <p class="mt-2 text-sm text-[var(--ca-muted)]">
                  {{ item.description }}
                </p>
              </article>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <section id="fitur" class="ca-section pt-0">
      <div class="ca-container">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="feature in features"
            :key="feature.title"
            class="ca-card-soft p-5"
          >
            <div
              class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]"
            >
              <Icon :name="feature.icon" class="h-5 w-5 ca-tone-emerald" />
            </div>
            <h3 class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]">
              {{ feature.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ feature.description }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <section id="harga" v-if="pricingPlans.length" class="ca-section pt-0">
      <div class="ca-container">
        <div class="mb-8 text-center">
          <span class="ca-kicker">{{ t('solutions.pantau.pricing.label') }}</span>
          <h2 class="ca-title mt-4">{{ t('solutions.pantau.pricing.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('solutions.pantau.pricing.subtitle') }}</p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="plan in pricingPlans"
            :key="plan.name"
            class="ca-card p-5 transition"
            :class="plan.popular ? 'ring-2 ring-[var(--ca-emerald)]' : ''"
          >
            <div v-if="plan.popular" class="mb-3">
              <span class="rounded-full bg-[var(--ca-emerald)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white">
                Popular
              </span>
            </div>
            <h3 class="text-lg font-display font-bold text-[var(--ca-text)]">
              {{ plan.name }}
            </h3>
            <p class="mt-1 text-2xl font-bold text-[var(--ca-text)]">
              {{ plan.price }}
            </p>
            <p class="mt-2 text-sm text-[var(--ca-muted)]">
              {{ plan.description }}
            </p>
            <ul class="mt-4 space-y-2">
              <li
                v-for="feature in plan.features"
                :key="feature"
                class="flex items-start gap-2 text-sm text-[var(--ca-muted)]"
              >
                <Icon name="lucide:check" class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 ca-tone-emerald" />
                <span>{{ feature }}</span>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <span class="ca-kicker">{{ t('solutions.pantau.audience.label') }}</span>
            <h2 class="ca-title mt-4">{{ t('solutions.pantau.audience.title') }}</h2>
            <p class="ca-copy mt-4 max-w-2xl">{{ t('solutions.pantau.audience.subtitle') }}</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <article
              v-for="item in audienceItems"
              :key="item.title"
              class="ca-card p-5"
            >
              <div
                class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)]"
              >
                <Icon :name="item.icon" class="h-4 w-4 ca-tone-emerald" />
              </div>
              <h3 class="mt-4 text-base font-display font-semibold text-[var(--ca-text)]">
                {{ item.title }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                {{ item.description }}
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="ca-card p-6 text-center sm:p-10">
          <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
            {{ t('solutions.pantau.cta.title') }}
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
            {{ t('solutions.pantau.cta.subtitle') }}
          </p>
          <div class="mt-6">
            <a href="https://pantau.coreasia.id" target="_blank" rel="noopener noreferrer" class="ca-btn-primary-emerald">
              {{ t('solutions.pantau.cta.button') }}
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
