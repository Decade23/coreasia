<script setup lang="ts">
import { LINKS } from '~/utils/constants'

const { t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()

const heroContent = useReveal('fadeUp')
const featuresHeader = useReveal('fadeUp')
const audienceHeader = useReveal('fadeUp')
const relatedProductSection = useReveal('fadeUp')
const faqSection = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

useCoreSeo({
  title: t('services.webMonitoringDashboard.title') as string,
  description: t('services.webMonitoringDashboard.description') as string,
  path: '/layanan/web-monitoring-dashboard',
})

useSchemaOrg([
  defineWebPage({
    name: t('services.webMonitoringDashboard.title') as string,
    description: t('services.webMonitoringDashboard.description') as string,
  }),
])

// SoftwareApplication + FAQ schema
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Pantau — Web Monitoring Dashboard',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: t('services.webMonitoringDashboard.description') as string,
        url: 'https://coreasia.id/layanan/web-monitoring-dashboard',
        provider: {
          '@type': 'Organization',
          name: 'CoreAsia Teknologi',
          url: 'https://coreasia.id',
        },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'IDR',
          availability: 'https://schema.org/InStock',
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: ((t('services.webMonitoringDashboard.faq.items') as Array<{ question: string; answer: string }>) || []).map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }),
    },
  ],
})

const features = computed(() => (t('services.webMonitoringDashboard.features.items') as Array<Record<string, string>>) || [])
const audienceItems = computed(() => (t('services.webMonitoringDashboard.audience.items') as Array<Record<string, string>>) || [])
const faqItems = computed(() => (t('services.webMonitoringDashboard.faq.items') as Array<{ question: string; answer: string }>) || [])
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(980px_420px_at_15%_0%,rgba(16,185,129,0.2),transparent_60%)]" />
        <div class="absolute inset-0 bg-[radial-gradient(880px_460px_at_95%_10%,rgba(14,165,233,0.16),transparent_64%)]" />
      </div>

      <div class="ca-container relative ca-section pt-6 sm:pt-8 lg:py-28">
        <div ref="heroContent" class="mx-auto max-w-4xl text-center">
          <span class="ca-kicker">
            <Icon name="lucide:bar-chart-3" class="h-3.5 w-3.5 ca-tone-emerald" />
            {{ t('services.webMonitoringDashboard.kicker') }}
          </span>
          <h1
            class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
            v-html="t('services.webMonitoringDashboard.hero.title')"
          />
          <p class="ca-copy mx-auto mt-5 max-w-2xl">
            {{ t('services.webMonitoringDashboard.hero.subtitle') }}
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="https://pantau.coreasia.id" target="_blank" rel="noopener noreferrer" class="ca-btn-primary-emerald">
              {{ t('services.webMonitoringDashboard.hero.ctaPrimary') }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </a>
            <NuxtLink to="/products/pantau" class="ca-btn-secondary">
              {{ t('services.webMonitoringDashboard.hero.ctaSecondary') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="ca-section">
      <div class="ca-container">
        <div ref="featuresHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.webMonitoringDashboard.features.title') }}</h2>
        </div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="(feature, index) in features" :key="feature.title" :ref="revealRef('fadeUp', index * 80)" class="ca-card-soft p-5">
            <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
              <Icon :name="feature.icon" class="h-5 w-5 ca-tone-emerald" />
            </div>
            <h3 class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]">{{ feature.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ feature.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Audience -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="audienceHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.webMonitoringDashboard.audience.title') }}</h2>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <article v-for="(item, index) in audienceItems" :key="item.title" :ref="revealRef('fadeUp', index * 80)" class="ca-card p-5">
            <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)]">
              <Icon :name="item.icon" class="h-4 w-4 ca-tone-emerald" />
            </div>
            <h3 class="mt-4 text-base font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Related Product -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="relatedProductSection" class="ca-card p-5 sm:p-6">
          <div class="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <span class="ca-kicker">
                <Icon name="lucide:bar-chart-3" class="h-3.5 w-3.5 ca-tone-emerald" />
                Produk Terkait
              </span>
              <h3 class="mt-3 text-xl font-display font-bold text-[var(--ca-text)]">Pantau by CoreAsia</h3>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                Solusi web monitoring kami yang lengkap. Lihat detail fitur, pricing, dan cara kerja Pantau.
              </p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row md:justify-end">
              <NuxtLink to="/products/pantau" class="ca-btn-primary-emerald">
                Pelajari Pantau
                <Icon name="lucide:arrow-right" class="h-4 w-4" />
              </NuxtLink>
              <NuxtLink to="/pricing" class="ca-btn-secondary">
                Lihat Harga
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="faqSection" class="ca-card p-6 sm:p-8">
          <h2 class="ca-title mb-6">{{ t('services.webMonitoringDashboard.faq.title') }}</h2>
          <div class="space-y-3">
            <article v-for="faq in faqItems" :key="faq.question" class="rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4">
              <h3 class="text-sm font-semibold text-[var(--ca-text)] sm:text-base">{{ faq.question }}</h3>
              <p class="mt-2 text-sm text-[var(--ca-muted)]">{{ faq.answer }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="ctaSection" class="ca-card p-6 text-center sm:p-10">
          <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
            {{ t('services.webMonitoringDashboard.cta.title') }}
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
            {{ t('services.webMonitoringDashboard.cta.subtitle') }}
          </p>
          <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="https://pantau.coreasia.id" target="_blank" rel="noopener noreferrer" class="ca-btn-primary-emerald">
              {{ t('services.webMonitoringDashboard.cta.button') }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </a>
            <a :href="LINKS.whatsapp" target="_blank" rel="noopener noreferrer" class="ca-btn-secondary">
              <Icon name="lucide:message-circle" class="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
