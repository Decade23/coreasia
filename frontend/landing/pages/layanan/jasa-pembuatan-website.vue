<script setup lang="ts">
import { useWhatsAppLink } from '~/composables/useWhatsAppLink'

// Tautan WhatsApp membawa nama halaman asal, karena kliknya tidak pernah
// tercatat sebagai konversi Google Ads. Lihat composables/useWhatsAppLink.ts.
const { buildContextualUrl } = useWhatsAppLink()
const waUrl = computed(() => buildContextualUrl())

const { t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()

const heroContent = useReveal('fadeUp')
const whyUsHeader = useReveal('fadeUp')
const serviceTypesHeader = useReveal('fadeUp')
const pricingHeader = useReveal('fadeUp')
const serviceAreaSection = useReveal('scaleUp')
const processHeader = useReveal('fadeUp')
const relatedProductSection = useReveal('fadeUp')
const faqSection = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

useCoreSeo({
  title: t('services.jasaPembuatanWebsite.title') as string,
  description: t('services.jasaPembuatanWebsite.description') as string,
  path: '/layanan/jasa-pembuatan-website',
})

useSchemaOrg([
  defineWebPage({
    name: t('services.jasaPembuatanWebsite.title') as string,
    description: t('services.jasaPembuatanWebsite.description') as string,
  }),
])

// Service + FAQ schema with city-level areaServed
const serviceCities = ['Jakarta', 'Surabaya', 'Bandung', 'Tangerang', 'Bekasi', 'Makassar', 'Semarang', 'Yogyakarta', 'Medan', 'Bali']
const faqItems = computed(() => (t('services.jasaPembuatanWebsite.faq.items') as Array<{ question: string; answer: string }>) || [])

// Penawaran pada JSON-LD dibangun dari blok konten yang sama dengan kartu harga,
// sehingga nama, deskripsi, dan angkanya punya satu sumber dan ikut bahasa aktif.
type PricingItem = { type: string; range: string; lowPrice: string; description: string }
const offerItems = (t('services.jasaPembuatanWebsite.pricing.items') as PricingItem[]) || []

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: t('services.jasaPembuatanWebsite.schema.serviceName') as string,
        serviceType: 'Web Development',
        description: t('services.jasaPembuatanWebsite.description') as string,
        url: 'https://coreasia.id/layanan/jasa-pembuatan-website',
        provider: {
          '@type': 'Organization',
          name: 'CoreAsia Teknologi',
          url: 'https://coreasia.id',
        },
        areaServed: [
          { '@type': 'Country', name: 'Indonesia' },
          ...serviceCities.map((city) => ({ '@type': 'City', name: city })),
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: t('services.jasaPembuatanWebsite.schema.offerCatalogName') as string,
          // Harga di halaman ini bersifat "mulai dari", bukan harga pasti.
          // Karena itu setiap paket dinyatakan sebagai AggregateOffer dengan
          // batas bawah (lowPrice dan PriceSpecification.minPrice), tanpa properti `price`.
          // offerCount disertakan karena Google menyarankannya untuk AggregateOffer:
          // tiap entri di sini mewakili tepat satu paket.
          itemListElement: offerItems.map((item) => ({
            '@type': 'AggregateOffer',
            name: item.type,
            description: item.description,
            priceCurrency: 'IDR',
            lowPrice: item.lowPrice,
            offerCount: '1',
            priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'IDR', minPrice: item.lowPrice },
          })),
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: ((t('services.jasaPembuatanWebsite.faq.items') as Array<{ question: string; answer: string }>) || []).map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }),
    },
  ],
})

const whyUsItems = computed(() => (t('services.jasaPembuatanWebsite.whyUs.items') as Array<Record<string, string>>) || [])
const serviceTypeItems = computed(() => (t('services.jasaPembuatanWebsite.serviceTypes.items') as Array<Record<string, string>>) || [])
const pricingItems = computed(() => (t('services.jasaPembuatanWebsite.pricing.items') as Array<Record<string, string>>) || [])
const serviceAreaCities = computed(() => (t('services.jasaPembuatanWebsite.serviceAreas.cities') as string[]) || [])
const processItems = computed(() => (t('services.jasaPembuatanWebsite.process.items') as Array<Record<string, string>>) || [])
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(980px_420px_at_15%_0%,rgba(251,191,36,0.18),transparent_60%)]" />
        <div class="absolute inset-0 bg-[radial-gradient(880px_460px_at_95%_10%,rgba(139,92,246,0.14),transparent_64%)]" />
      </div>

      <div class="ca-container relative ca-section pt-6 sm:pt-8 lg:py-28">
        <div ref="heroContent" class="mx-auto max-w-4xl text-center">
          <span class="ca-kicker">
            <Icon name="lucide:code-2" class="h-3.5 w-3.5 ca-tone-gold" />
            {{ t('services.jasaPembuatanWebsite.kicker') }}
          </span>
          <h1
            class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
            v-html="t('services.jasaPembuatanWebsite.hero.title')"
          />
          <p class="ca-copy mx-auto mt-5 max-w-2xl">
            {{ t('services.jasaPembuatanWebsite.hero.subtitle') }}
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <NuxtLink to="/contact?subject=website" class="ca-btn-primary">
              {{ t('services.jasaPembuatanWebsite.hero.ctaPrimary') }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </NuxtLink>
            <NuxtLink to="/portfolio" class="ca-btn-secondary">
              {{ t('services.jasaPembuatanWebsite.hero.ctaSecondary') }}
            </NuxtLink>
            <!-- Tautan dalam halaman: pakai anchor biasa supaya lompatannya
                 ditangani browser (menghormati scroll-padding-top di main.css)
                 dan tetap jalan meski hash-nya sudah aktif. Posisinya di hero
                 karena bagian harga ada di bawahnya. -->
            <a href="#paket-harga" class="ca-btn-secondary">
              {{ t('services.jasaPembuatanWebsite.hero.ctaTertiary') }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Us -->
    <section class="ca-section">
      <div class="ca-container">
        <div ref="whyUsHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.jasaPembuatanWebsite.whyUs.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.jasaPembuatanWebsite.whyUs.subtitle') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="(item, index) in whyUsItems" :key="item.title" :ref="revealRef('fadeUp', index * 80)" class="ca-card-soft p-5">
            <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
              <Icon :name="item.icon" class="h-5 w-5 ca-tone-gold" />
            </div>
            <h3 class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Service Types -->
    <section id="jenis-website" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="serviceTypesHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.jasaPembuatanWebsite.serviceTypes.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.jasaPembuatanWebsite.serviceTypes.subtitle') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <article v-for="(item, index) in serviceTypeItems" :key="item.title" :ref="revealRef('fadeUp', index * 80)" class="ca-card-soft p-5">
            <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
              <Icon :name="item.icon" class="h-5 w-5 ca-tone-gold" />
            </div>
            <h3 class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Pricing Estimate -->
    <section id="paket-harga" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="pricingHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.jasaPembuatanWebsite.pricing.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.jasaPembuatanWebsite.pricing.subtitle') }}</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article v-for="(item, index) in pricingItems" :key="item.type" :ref="revealRef('fadeUp', index * 80)" class="ca-card p-5 text-center">
            <h3 class="text-base font-display font-semibold text-[var(--ca-text)]">{{ item.type }}</h3>
            <p class="mt-2 text-xl font-display font-bold ca-tone-gold">{{ item.range }}</p>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </article>
        </div>
        <p class="mt-4 text-center text-xs text-[var(--ca-subtle)]">{{ t('services.jasaPembuatanWebsite.pricing.note') }}</p>
      </div>
    </section>

    <!-- Service Areas -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="serviceAreaSection" class="ca-card p-6 text-center sm:p-8">
          <h2 class="ca-title">{{ t('services.jasaPembuatanWebsite.serviceAreas.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.jasaPembuatanWebsite.serviceAreas.subtitle') }}</p>
          <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span
              v-for="city in serviceAreaCities"
              :key="city"
              class="ca-chip"
            >
              <Icon name="lucide:map-pin" class="h-3 w-3" />
              {{ city }}
            </span>
          </div>
          <p class="ca-copy mx-auto mt-4 max-w-xl text-sm">{{ t('services.jasaPembuatanWebsite.serviceAreas.description') }}</p>
        </div>
      </div>
    </section>

    <!-- Process -->
    <section id="proses" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="processHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.jasaPembuatanWebsite.process.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.jasaPembuatanWebsite.process.subtitle') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="(item, index) in processItems" :key="item.step" :ref="revealRef('fadeUp', index * 80)" class="ca-card p-5 text-center">
            <span class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--ca-gold-border)] bg-[var(--ca-panel-bg-strong)] font-display text-lg font-bold ca-tone-gold">
              {{ item.step }}
            </span>
            <h3 class="mt-4 text-base font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Related Products -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="relatedProductSection" class="ca-card p-5 sm:p-6">
          <div class="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <span class="ca-kicker">
                <Icon name="lucide:box" class="h-3.5 w-3.5 ca-tone-gold" />
                {{ t('services.jasaPembuatanWebsite.relatedProduct.kicker') }}
              </span>
              <h3 class="mt-3 text-xl font-display font-bold text-[var(--ca-text)]">
                {{ t('services.jasaPembuatanWebsite.relatedProduct.title') }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                {{ t('services.jasaPembuatanWebsite.relatedProduct.description') }}
              </p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row md:justify-end">
              <NuxtLink to="/products/build" class="ca-btn-primary">
                {{ t('services.jasaPembuatanWebsite.relatedProduct.ctaPrimary') }}
                <Icon name="lucide:arrow-right" class="h-4 w-4" />
              </NuxtLink>
              <NuxtLink to="/layanan/jasa-pembuatan-aplikasi-web" class="ca-btn-secondary">
                {{ t('services.jasaPembuatanWebsite.relatedProduct.ctaSecondary') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="faqSection" class="ca-card p-6 sm:p-8">
          <h2 class="ca-title mb-6">{{ t('services.jasaPembuatanWebsite.faq.title') }}</h2>
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
            {{ t('services.jasaPembuatanWebsite.cta.title') }}
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
            {{ t('services.jasaPembuatanWebsite.cta.subtitle') }}
          </p>
          <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <NuxtLink to="/contact?subject=website" class="ca-btn-primary">
              {{ t('services.jasaPembuatanWebsite.cta.button') }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </NuxtLink>
            <a :href="waUrl" target="_blank" rel="noopener noreferrer" class="ca-btn-secondary">
              <Icon name="lucide:message-circle" class="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
