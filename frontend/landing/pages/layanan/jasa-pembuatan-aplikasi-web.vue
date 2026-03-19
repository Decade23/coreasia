<script setup lang="ts">
import { LINKS } from '~/utils/constants'

const { t } = useCoreI18n()

useCoreSeo({
  title: t('services.jasaPembuatanAplikasiWeb.title') as string,
  description: t('services.jasaPembuatanAplikasiWeb.description') as string,
  path: '/layanan/jasa-pembuatan-aplikasi-web',
})

useSchemaOrg([
  defineWebPage({
    name: t('services.jasaPembuatanAplikasiWeb.title') as string,
    description: t('services.jasaPembuatanAplikasiWeb.description') as string,
  }),
])

// Service + FAQ schema
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Jasa Pembuatan Aplikasi Web Custom',
        serviceType: 'Custom Software Development',
        description: t('services.jasaPembuatanAplikasiWeb.description') as string,
        url: 'https://coreasia.id/layanan/jasa-pembuatan-aplikasi-web',
        provider: {
          '@type': 'Organization',
          name: 'CoreAsia Teknologi',
          url: 'https://coreasia.id',
        },
        areaServed: { '@type': 'Country', name: 'Indonesia' },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: ((t('services.jasaPembuatanAplikasiWeb.faq.items') as Array<{ question: string; answer: string }>) || []).map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }),
    },
  ],
})

const capabilities = computed(() => (t('services.jasaPembuatanAplikasiWeb.capabilities.items') as Array<Record<string, string>>) || [])
const techStack = computed(() => (t('services.jasaPembuatanAplikasiWeb.techStack.items') as string[]) || [])
const faqItems = computed(() => (t('services.jasaPembuatanAplikasiWeb.faq.items') as Array<{ question: string; answer: string }>) || [])
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(980px_420px_at_15%_0%,rgba(251,191,36,0.18),transparent_60%)]" />
        <div class="absolute inset-0 bg-[radial-gradient(880px_460px_at_95%_10%,rgba(14,116,144,0.14),transparent_64%)]" />
      </div>

      <div class="ca-container relative ca-section pt-6 sm:pt-8 lg:py-28">
        <div class="mx-auto max-w-4xl text-center">
          <span class="ca-kicker">
            <Icon name="lucide:code-2" class="h-3.5 w-3.5 ca-tone-gold" />
            {{ t('services.jasaPembuatanAplikasiWeb.kicker') }}
          </span>
          <h1
            class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
            v-html="t('services.jasaPembuatanAplikasiWeb.hero.title')"
          />
          <p class="ca-copy mx-auto mt-5 max-w-2xl">
            {{ t('services.jasaPembuatanAplikasiWeb.hero.subtitle') }}
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <NuxtLink to="/contact?subject=webapp" class="ca-btn-primary">
              {{ t('services.jasaPembuatanAplikasiWeb.hero.ctaPrimary') }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </NuxtLink>
            <NuxtLink to="/products" class="ca-btn-secondary">
              {{ t('services.jasaPembuatanAplikasiWeb.hero.ctaSecondary') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Capabilities -->
    <section class="ca-section">
      <div class="ca-container">
        <div class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.jasaPembuatanAplikasiWeb.capabilities.title') }}</h2>
        </div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="item in capabilities" :key="item.title" class="ca-card-soft p-5">
            <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
              <Icon :name="item.icon" class="h-5 w-5 ca-tone-gold" />
            </div>
            <h3 class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Tech Stack -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="ca-card p-5 sm:p-6">
          <h2 class="text-xl font-display font-bold text-[var(--ca-text)]">
            {{ t('services.jasaPembuatanAplikasiWeb.techStack.title') }}
          </h2>
          <div class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="tech in techStack"
              :key="tech"
              class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-3 py-1.5 text-sm font-medium text-[var(--ca-text)]"
            >
              {{ tech }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Products -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="ca-card p-5">
            <span class="ca-kicker"><Icon name="lucide:code-2" class="h-3.5 w-3.5 ca-tone-gold" /> Build</span>
            <h3 class="mt-2 text-lg font-display font-bold text-[var(--ca-text)]">Build by CoreAsia</h3>
            <p class="mt-2 text-sm text-[var(--ca-muted)]">Layanan development website dan aplikasi web custom kami.</p>
            <NuxtLink to="/products/build" class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ca-tone-gold">
              Pelajari Build <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </NuxtLink>
          </div>
          <div class="ca-card p-5">
            <span class="ca-kicker"><Icon name="lucide:bar-chart-3" class="h-3.5 w-3.5 ca-tone-emerald" /> Pantau</span>
            <h3 class="mt-2 text-lg font-display font-bold text-[var(--ca-text)]">Pantau by CoreAsia</h3>
            <p class="mt-2 text-sm text-[var(--ca-muted)]">Dashboard monitoring web yang kami bangun sendiri dengan stack ini.</p>
            <NuxtLink to="/products/pantau" class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ca-tone-emerald">
              Pelajari Pantau <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="ca-card p-6 sm:p-8">
          <h2 class="ca-title mb-6">{{ t('services.jasaPembuatanAplikasiWeb.faq.title') }}</h2>
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
        <div class="ca-card p-6 text-center sm:p-10">
          <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
            {{ t('services.jasaPembuatanAplikasiWeb.cta.title') }}
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
            {{ t('services.jasaPembuatanAplikasiWeb.cta.subtitle') }}
          </p>
          <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <NuxtLink to="/contact?subject=webapp" class="ca-btn-primary">
              {{ t('services.jasaPembuatanAplikasiWeb.cta.button') }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </NuxtLink>
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
