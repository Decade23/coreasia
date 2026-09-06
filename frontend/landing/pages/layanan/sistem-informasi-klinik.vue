<script setup lang="ts">
import { useWhatsAppLink } from '~/composables/useWhatsAppLink'

// Tautan WhatsApp membawa nama halaman asal, karena kliknya tidak pernah
// tercatat sebagai konversi Google Ads. Lihat composables/useWhatsAppLink.ts.
const { buildContextualUrl } = useWhatsAppLink()
const waUrl = computed(() => buildContextualUrl())

// Nomor WhatsApp resmi sudah diputuskan: +62 851-2153-3395, ditulis 6285121533395
// pada tautan. Satu-satunya tempat nomor itu hidup adalah utils/constants.ts, dan
// halaman ini mengambilnya dari sana lewat useWhatsAppLink, jadi tidak ada nomor
// yang perlu ditulis ulang di berkas ini. Dua nomor lain yang sempat ikut beredar
// di berkas referensi lama tidak dipakai di dokumen klien mana pun; daftarnya ada di
// tender/PlanIndonesia-KitaKerja/3-REFERENSI/data-perusahaan.md. Kalau salah satunya
// muncul lagi di dokumen, yang keliru berkas referensinya, bukan halaman ini.
//
// [BLOKER: KBLI] Lampiran NIB CoreAsia baru memuat 62011 (pengembangan video game).
// Halaman ini menjual jasa sistem informasi yang wilayahnya 62019 dan 62029.
// Menayangkannya sebelum KBLI itu aktif adalah eksposur perizinan, bukan sekadar
// urusan naskah. Keputusan tayang ada di Dedi.

// Subjek formulir kontak memakai kunci `klinik`, terdaftar di contact.form.subjects
// pada kedua berkas konten dan di SubjectLabels pada
// backend/gateway/internal/model/contact_lead.go. Label sisi gerbang baru terpakai
// setelah gerbang di-deploy ulang; sebelum itu lead tetap masuk, hanya dengan kunci
// mentahnya, karena subjek asing sengaja diteruskan apa adanya.
const contactPath = '/contact?subject=klinik'

const { t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()

const heroContent = useReveal('fadeUp')
const problemsHeader = useReveal('fadeUp')
const outcomesHeader = useReveal('fadeUp')
const scopeHeader = useReveal('fadeUp')
const regulationHeader = useReveal('fadeUp')
const regulationNote = useReveal('fadeIn')
const pricingHeader = useReveal('fadeUp')
const pricingCard = useReveal('scaleUp')
const caseStudySection = useReveal('scaleUp')
const relatedHeader = useReveal('fadeUp')
const faqSection = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

useCoreSeo({
  title: t('services.sistemInformasiKlinik.title') as string,
  description: t('services.sistemInformasiKlinik.description') as string,
  path: '/layanan/sistem-informasi-klinik',
})

useSchemaOrg([
  defineWebPage({
    name: t('services.sistemInformasiKlinik.title') as string,
    description: t('services.sistemInformasiKlinik.description') as string,
  }),
])

// Penawaran pada JSON-LD dibaca dari blok konten yang sama dengan kartu harga,
// supaya angkanya punya satu sumber. Harganya bersifat batas bawah, jadi bentuknya
// AggregateOffer dengan lowPrice dan PriceSpecification.minPrice, bukan `price`.
type PricingBlock = { headline: string, range: string, lowPrice: string, duration: string }
const pricingOffer = t('services.sistemInformasiKlinik.pricing') as unknown as PricingBlock

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: t('services.sistemInformasiKlinik.schema.serviceName') as string,
        serviceType: 'Custom Software Development',
        description: t('services.sistemInformasiKlinik.description') as string,
        url: 'https://coreasia.id/layanan/sistem-informasi-klinik',
        provider: {
          '@type': 'Organization',
          name: 'CoreAsia Teknologi',
          url: 'https://coreasia.id',
        },
        areaServed: { '@type': 'Country', name: 'Indonesia' },
        offers: {
          '@type': 'AggregateOffer',
          name: pricingOffer.headline,
          priceCurrency: 'IDR',
          lowPrice: pricingOffer.lowPrice,
          offerCount: '1',
          priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'IDR', minPrice: pricingOffer.lowPrice },
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: ((t('services.sistemInformasiKlinik.faq.items') as Array<{ question: string, answer: string }>) || []).map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }),
    },
  ],
})

// Kartu berikon dipakai lima kali di halaman ini. Bentuknya ditulis eksplisit karena
// tsconfig bawaan Nuxt menyalakan noUncheckedIndexedAccess: dengan Record<string, string>
// setiap field terbaca string | undefined, dan <Icon :name> menolaknya saat diperiksa tipe.
type KartuIkon = { icon: string, title: string, description: string, to?: string }

const problemItems = computed(() => (t('services.sistemInformasiKlinik.problems.items') as KartuIkon[]) || [])
const outcomeItems = computed(() => (t('services.sistemInformasiKlinik.outcomes.items') as KartuIkon[]) || [])
const scopeItems = computed(() => (t('services.sistemInformasiKlinik.scope.items') as KartuIkon[]) || [])
const regulationItems = computed(() => (t('services.sistemInformasiKlinik.regulation.items') as Array<Record<string, string>>) || [])
const pricingFactors = computed(() => (t('services.sistemInformasiKlinik.pricing.factors') as KartuIkon[]) || [])
const caseStudyPoints = computed(() => (t('services.sistemInformasiKlinik.caseStudy.points') as string[]) || [])
const relatedItems = computed(() => (t('services.sistemInformasiKlinik.related.items') as KartuIkon[]) || [])
const faqItems = computed(() => (t('services.sistemInformasiKlinik.faq.items') as Array<{ question: string, answer: string }>) || [])
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
            <Icon name="lucide:stethoscope" class="h-3.5 w-3.5 ca-tone-gold" />
            {{ t('services.sistemInformasiKlinik.kicker') }}
          </span>
          <h1
            class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
            v-html="t('services.sistemInformasiKlinik.hero.title')"
          />
          <p class="ca-copy mx-auto mt-5 max-w-2xl">
            {{ t('services.sistemInformasiKlinik.hero.subtitle') }}
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <NuxtLink :to="contactPath" class="ca-btn-primary">
              {{ t('services.sistemInformasiKlinik.hero.ctaPrimary') }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </NuxtLink>
            <NuxtLink to="/portfolio" class="ca-btn-secondary">
              {{ t('services.sistemInformasiKlinik.hero.ctaSecondary') }}
            </NuxtLink>
            <!-- Lompatan dalam halaman pakai anchor biasa supaya browser yang
                 menanganinya dan scroll-padding-top di main.css tetap dihormati. -->
            <a href="#dasar-aturan" class="ca-btn-secondary">
              {{ t('services.sistemInformasiKlinik.hero.ctaTertiary') }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Studi kasus -->
    <section class="ca-section">
      <div class="ca-container">
        <div ref="caseStudySection" class="ca-card p-6 sm:p-8">
          <span class="ca-kicker">
            <Icon name="lucide:folder-check" class="h-3.5 w-3.5 ca-tone-gold" />
            {{ t('services.sistemInformasiKlinik.caseStudy.kicker') }}
          </span>
          <h2 class="mt-3 font-display text-2xl font-bold text-[var(--ca-text)] sm:text-3xl">
            {{ t('services.sistemInformasiKlinik.caseStudy.title') }}
          </h2>
          <p class="mt-2 text-xs font-semibold tracking-widest uppercase text-[var(--ca-subtle)]">
            {{ t('services.sistemInformasiKlinik.caseStudy.sector') }}
          </p>
          <p class="mt-4 text-sm leading-relaxed text-[var(--ca-muted)] sm:text-base">
            {{ t('services.sistemInformasiKlinik.caseStudy.description') }}
          </p>
          <ul class="mt-5 grid gap-2 sm:grid-cols-2">
            <li v-for="point in caseStudyPoints" :key="point" class="flex items-start gap-2 text-sm text-[var(--ca-text)]">
              <Icon name="lucide:check" class="mt-0.5 h-4 w-4 shrink-0 ca-tone-gold" />
              <span>{{ point }}</span>
            </li>
          </ul>
          <p class="mt-5 text-sm leading-relaxed text-[var(--ca-subtle)]">
            {{ t('services.sistemInformasiKlinik.caseStudy.note') }}
          </p>
          <NuxtLink to="/portfolio" class="ca-link-accent mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
            {{ t('services.sistemInformasiKlinik.caseStudy.ctaLabel') }}
            <Icon name="lucide:arrow-right" class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Masalah -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="problemsHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.sistemInformasiKlinik.problems.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.sistemInformasiKlinik.problems.subtitle') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="(item, index) in problemItems" :key="item.title" :ref="revealRef('fadeUp', index * 80)" class="ca-card-soft p-5">
            <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
              <Icon :name="item.icon" class="h-5 w-5 ca-tone-gold" />
            </div>
            <h3 class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Yang berubah -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="outcomesHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.sistemInformasiKlinik.outcomes.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.sistemInformasiKlinik.outcomes.subtitle') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="(item, index) in outcomeItems" :key="item.title" :ref="revealRef('fadeUp', index * 80)" class="ca-card p-5">
            <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)]">
              <Icon :name="item.icon" class="h-4 w-4 ca-tone-gold" />
            </div>
            <h3 class="mt-4 text-base font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Ruang lingkup -->
    <section id="lingkup" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="scopeHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.sistemInformasiKlinik.scope.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.sistemInformasiKlinik.scope.subtitle') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <article v-for="(item, index) in scopeItems" :key="item.title" :ref="revealRef('fadeUp', index * 80)" class="ca-card-soft p-5">
            <div class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
              <Icon :name="item.icon" class="h-5 w-5 ca-tone-gold" />
            </div>
            <h3 class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Dasar aturan -->
    <section id="dasar-aturan" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="regulationHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.sistemInformasiKlinik.regulation.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.sistemInformasiKlinik.regulation.subtitle') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <article v-for="(item, index) in regulationItems" :key="item.title" :ref="revealRef('fadeUp', index * 80)" class="ca-card p-5">
            <h3 class="text-base font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h3>
            <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.body }}</p>
            <a
              :href="item.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ca-link-accent mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
            >
              <Icon name="lucide:external-link" class="h-3.5 w-3.5" />
              {{ item.sourceLabel }}
            </a>
          </article>
        </div>
        <div ref="regulationNote" class="ca-card-soft mt-4 p-5">
          <p class="text-sm leading-relaxed text-[var(--ca-subtle)]">
            {{ t('services.sistemInformasiKlinik.regulation.disclaimer') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Harga dan durasi -->
    <section id="paket-harga" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="pricingHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.sistemInformasiKlinik.pricing.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.sistemInformasiKlinik.pricing.subtitle') }}</p>
        </div>
        <div ref="pricingCard" class="ca-card p-6 text-center sm:p-8">
          <h3 class="text-base font-display font-semibold text-[var(--ca-text)]">
            {{ t('services.sistemInformasiKlinik.pricing.headline') }}
          </h3>
          <p class="mt-3 font-display text-3xl font-bold ca-tone-gold sm:text-4xl">
            {{ t('services.sistemInformasiKlinik.pricing.range') }}
          </p>
          <p class="mt-2 text-sm text-[var(--ca-muted)]">
            {{ t('services.sistemInformasiKlinik.pricing.duration') }}
          </p>
          <p class="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-[var(--ca-subtle)]">
            {{ t('services.sistemInformasiKlinik.pricing.note') }}
          </p>
          <NuxtLink
            :to="t('services.sistemInformasiKlinik.pricing.noteLinkTo') as string"
            class="ca-link-accent mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            {{ t('services.sistemInformasiKlinik.pricing.noteLinkLabel') }}
            <Icon name="lucide:arrow-right" class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>
        <h3 class="mt-8 mb-4 text-center text-base font-display font-semibold text-[var(--ca-text)]">
          {{ t('services.sistemInformasiKlinik.pricing.factorsTitle') }}
        </h3>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="(item, index) in pricingFactors" :key="item.title" :ref="revealRef('fadeUp', index * 60)" class="ca-card-soft p-5">
            <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
              <Icon :name="item.icon" class="h-4 w-4 ca-tone-gold" />
            </div>
            <h4 class="mt-4 text-base font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h4>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Halaman terkait -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="relatedHeader" class="mb-8 text-center">
          <h2 class="ca-title">{{ t('services.sistemInformasiKlinik.related.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">{{ t('services.sistemInformasiKlinik.related.subtitle') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <NuxtLink
            v-for="(item, index) in relatedItems"
            :key="item.to"
            :ref="revealRef('fadeUp', index * 80)"
            :to="item.to"
            class="ca-card-soft block p-5 transition hover:border-[color:var(--ca-gold-border)]"
          >
            <div class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
              <Icon :name="item.icon" class="h-4 w-4 ca-tone-gold" />
            </div>
            <h3 class="mt-4 text-base font-display font-semibold text-[var(--ca-text)]">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="faqSection" class="ca-card p-6 sm:p-8">
          <h2 class="ca-title mb-6">{{ t('services.sistemInformasiKlinik.faq.title') }}</h2>
          <div class="space-y-3">
            <article v-for="faq in faqItems" :key="faq.question" class="rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4">
              <h3 class="text-sm font-semibold text-[var(--ca-text)] sm:text-base">{{ faq.question }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ faq.answer }}</p>
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
            {{ t('services.sistemInformasiKlinik.cta.title') }}
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
            {{ t('services.sistemInformasiKlinik.cta.subtitle') }}
          </p>
          <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <NuxtLink :to="contactPath" class="ca-btn-primary">
              {{ t('services.sistemInformasiKlinik.cta.button') }}
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
