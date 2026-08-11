<script setup lang="ts">
// CoreAsia Beres tinggal di subdomain sendiri (tools.coreasia.id). Halaman ini
// hanya etalase di coreasia.id, jadi semua CTA keluar ke sana. Angka harga
// diambil dari halaman harga produknya, bukan dikarang di sini; kalau harganya
// berubah, perbarui utils/content.*.ts bersamaan dengan situs produknya.
const BERES_URL = 'https://tools.coreasia.id'
const BERES_PRICING_URL = 'https://tools.coreasia.id/harga'

const { t } = useCoreI18n()

const PAGE_DESCRIPTION = t('solutions.beres.description') as string
const PAGE_URL = 'https://coreasia.id/products/beres'

useCoreSeo({
  title: t('solutions.beres.title') as string,
  description: PAGE_DESCRIPTION,
  path: '/products/beres',
})

useSchemaOrg([
  defineWebPage({
    name: 'CoreAsia Beres',
    description: PAGE_DESCRIPTION,
  }),
])

const faqItems = computed(
  () => (t('solutions.beres.faq.items') as Array<Record<string, string>>) || [],
)

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'CoreAsia Beres',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        description: PAGE_DESCRIPTION,
        url: PAGE_URL,
        provider: {
          '@type': 'Organization',
          name: 'PT Inti Asia Teknologi',
          url: 'https://coreasia.id',
        },
        // Rentang harga mencakup alat gratis sampai paket RapiKontak 5 kredit.
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'IDR',
          lowPrice: '0',
          highPrice: '40000',
          offerCount: 4,
          availability: 'https://schema.org/InStock',
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.value.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }),
    },
  ],
})

const { useReveal, revealRef } = useScrollReveal()

const heroText = useReveal('slideLeft')
const heroAside = useReveal('slideRight', 150)
const toolsHeader = useReveal('fadeUp')
const workflowHeader = useReveal('fadeUp')
const pricingHeader = useReveal('fadeUp')
const faqHeader = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

const heroChips = computed(
  () => (t('solutions.beres.hero.chips') as string[]) || [],
)
const painItems = computed(
  () => (t('solutions.beres.pain.items') as Array<Record<string, string>>) || [],
)
const toolItems = computed(
  () => (t('solutions.beres.tools.items') as Array<Record<string, string>>) || [],
)
const workflowSteps = computed(
  () => (t('solutions.beres.workflow.steps') as Array<Record<string, string>>) || [],
)
const pricingPlans = computed(
  () => (t('solutions.beres.pricing.plans') as Array<Record<string, string>>) || [],
)
</script>

<template>
  <div>
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div
          class="absolute inset-0 bg-[radial-gradient(980px_420px_at_15%_0%,rgba(251,191,36,0.18),transparent_60%)]"
        />
        <div
          class="absolute inset-0 bg-[radial-gradient(880px_460px_at_95%_10%,rgba(16,185,129,0.12),transparent_64%)]"
        />
      </div>

      <div class="ca-container relative ca-section pt-6 sm:pt-8 lg:py-28">
        <div class="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div ref="heroText">
            <span class="ca-kicker">
              <Icon name="lucide:file-check-2" class="h-3.5 w-3.5 ca-tone-gold" />
              {{ t('solutions.beres.kicker') }}
            </span>
            <h1
              class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
              v-html="t('solutions.beres.hero.title')"
            />
            <p class="ca-copy mt-5 max-w-2xl">
              {{ t('solutions.beres.hero.subtitle') }}
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a :href="BERES_URL" target="_blank" rel="noopener" class="ca-btn-primary">
                <Icon name="lucide:external-link" class="h-4 w-4" />
                {{ t('solutions.beres.hero.ctaPrimary') }}
              </a>
              <a href="#harga" class="ca-btn-secondary">
                {{ t('solutions.beres.hero.ctaSecondary') }}
              </a>
            </div>

            <div class="mt-6 flex flex-wrap gap-2">
              <span v-for="chip in heroChips" :key="chip" class="ca-chip">
                {{ chip }}
              </span>
            </div>
          </div>

          <aside ref="heroAside" class="ca-card p-5 sm:p-6">
            <p class="text-xs uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
              {{ t('solutions.beres.pain.label') }}
            </p>
            <h2 class="mt-2 text-xl font-display font-bold text-[var(--ca-text)]">
              {{ t('solutions.beres.pain.title') }}
            </h2>

            <div class="mt-5 space-y-3">
              <article
                v-for="item in painItems"
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

    <!-- Empat alat -->
    <section id="alat" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="toolsHeader" class="mb-8 max-w-2xl">
          <span class="ca-kicker">{{ t('solutions.beres.tools.label') }}</span>
          <h2 class="mt-4 font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
            {{ t('solutions.beres.tools.title') }}
          </h2>
          <p class="ca-copy mt-4">
            {{ t('solutions.beres.tools.subtitle') }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <article
            v-for="(tool, index) in toolItems"
            :key="tool.name"
            :ref="revealRef('fadeUp', index * 80)"
            class="ca-card flex flex-col p-5 sm:p-6"
          >
            <div class="flex items-start justify-between gap-3">
              <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
                {{ tool.name }}
              </h3>
              <span class="ca-chip shrink-0">{{ tool.price }}</span>
            </div>
            <p class="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--ca-subtle)]">
              {{ tool.audience }}
            </p>
            <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ tool.description }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- Cara kerja -->
    <section id="cara-kerja" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="workflowHeader" class="mb-8 max-w-2xl">
          <span class="ca-kicker">{{ t('solutions.beres.workflow.label') }}</span>
          <h2 class="mt-4 font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
            {{ t('solutions.beres.workflow.title') }}
          </h2>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <article
            v-for="(step, index) in workflowSteps"
            :key="step.title"
            :ref="revealRef('fadeUp', index * 100)"
            class="ca-card p-5 sm:p-6"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold"
              :style="{ background: 'var(--ca-panel-bg-strong)', color: 'var(--ca-text)' }"
            >
              {{ index + 1 }}
            </span>
            <h3 class="mt-4 font-display text-base font-bold text-[var(--ca-text)]">
              {{ step.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ step.description }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- Harga -->
    <section id="harga" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="pricingHeader" class="mb-8 max-w-2xl">
          <span class="ca-kicker">{{ t('solutions.beres.pricing.label') }}</span>
          <h2 class="mt-4 font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
            {{ t('solutions.beres.pricing.title') }}
          </h2>
          <p class="ca-copy mt-4">
            {{ t('solutions.beres.pricing.subtitle') }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <article
            v-for="(plan, index) in pricingPlans"
            :key="plan.name"
            :ref="revealRef('fadeUp', index * 90)"
            class="ca-card flex flex-col p-5 sm:p-6"
          >
            <h3 class="font-display text-lg font-bold text-[var(--ca-text)]">
              {{ plan.name }}
            </h3>
            <p class="mt-3 font-display text-2xl font-bold text-[var(--ca-text)]">
              {{ plan.price }}
            </p>
            <p class="text-sm text-[var(--ca-subtle)]">{{ plan.unit }}</p>
            <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ plan.description }}
            </p>
          </article>
        </div>

        <p class="ca-copy mt-6 max-w-2xl">
          {{ t('solutions.beres.pricing.note') }}
        </p>

        <a
          :href="BERES_PRICING_URL"
          target="_blank"
          rel="noopener"
          class="ca-btn-secondary mt-6"
        >
          <Icon name="lucide:external-link" class="h-4 w-4" />
          {{ t('solutions.beres.hero.ctaSecondary') }}
        </a>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="faqHeader" class="mb-8 max-w-2xl">
          <span class="ca-kicker">{{ t('solutions.beres.faq.label') }}</span>
          <h2 class="mt-4 font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
            {{ t('solutions.beres.faq.title') }}
          </h2>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <article
            v-for="(faq, index) in faqItems"
            :key="faq.question"
            :ref="revealRef('fadeUp', index * 70)"
            class="ca-card p-5 sm:p-6"
          >
            <h3 class="font-display text-base font-bold text-[var(--ca-text)]">
              {{ faq.question }}
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ faq.answer }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA penutup -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="ctaSection" class="ca-card p-6 text-center sm:p-10">
          <h2 class="font-display text-2xl font-bold text-[var(--ca-text)] sm:text-3xl">
            {{ t('solutions.beres.cta.title') }}
          </h2>
          <p class="ca-copy mx-auto mt-4 max-w-2xl">
            {{ t('solutions.beres.cta.subtitle') }}
          </p>
          <a
            :href="BERES_URL"
            target="_blank"
            rel="noopener"
            class="ca-btn-primary mt-7"
          >
            <Icon name="lucide:external-link" class="h-4 w-4" />
            {{ t('solutions.beres.cta.button') }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
