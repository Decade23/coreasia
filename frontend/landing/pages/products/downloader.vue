<script setup lang="ts">
import { LINKS, MERCHANT } from '~/utils/constants'

const { t } = useCoreI18n()

const PAGE_DESCRIPTION = t('solutions.downloader.description') as string
const PAGE_URL = 'https://coreasia.id/products/downloader'

useCoreSeo({
  title: t('solutions.downloader.title') as string,
  description: PAGE_DESCRIPTION,
  path: '/products/downloader',
})

useSchemaOrg([
  defineWebPage({
    name: 'CoreAsia Download Manager',
    description: PAGE_DESCRIPTION,
  }),
])

// Software application schema for rich snippets
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'CoreAsia Download Manager',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'macOS',
        description: PAGE_DESCRIPTION,
        url: PAGE_URL,
        provider: {
          '@type': 'Organization',
          name: 'PT Inti Asia Teknologi',
          url: 'https://coreasia.id',
        },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: '9.90',
          highPrice: '29',
          offerCount: 2,
          availability: 'https://schema.org/InStock',
        },
      }),
    },
  ],
})

const { useReveal, revealRef } = useScrollReveal()

const heroText = useReveal('slideLeft')
const heroAside = useReveal('slideRight', 150)
const pricingHeader = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

const heroChips = computed(
  () => (t('solutions.downloader.hero.chips') as string[]) || [],
)
const workflowAsideItems = computed(
  () => (t('solutions.downloader.workflowAside.items') as Array<Record<string, string>>) || [],
)
const features = computed(
  () => (t('solutions.downloader.features.items') as Array<Record<string, string>>) || [],
)
const workflowSteps = computed(
  () => (t('solutions.downloader.workflow.steps') as Array<Record<string, string>>) || [],
)
const platforms = computed(
  () => (t('solutions.downloader.platforms.items') as Array<Record<string, any>>) || [],
)
const pricingPlans = computed(
  () => (t('solutions.downloader.pricing.plans') as Array<Record<string, any>>) || [],
)

// Buka halaman checkout Gumroad (Merchant of Record) untuk membeli lisensi.
function buyNow(_path?: string) {
  window.open(MERCHANT.buyUrl, '_blank', 'noopener')
}
const privacyPoints = computed(
  () => (t('solutions.downloader.privacy.items') as Array<Record<string, string>>) || [],
)
const relatedItems = computed(
  () => (t('solutions.downloader.related.items') as Array<Record<string, string>>) || [],
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
          class="absolute inset-0 bg-[radial-gradient(880px_460px_at_95%_10%,rgba(14,165,233,0.14),transparent_64%)]"
        />
      </div>

      <div class="ca-container relative ca-section pt-6 sm:pt-8 lg:py-28">
        <div class="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div ref="heroText">
            <span class="ca-kicker">
              <Icon name="lucide:download" class="h-3.5 w-3.5 ca-tone-gold" />
              {{ t('solutions.downloader.kicker') }}
            </span>
            <h1
              class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
              v-html="t('solutions.downloader.hero.title')"
            />
            <p class="ca-copy mt-5 max-w-2xl">
              {{ t('solutions.downloader.hero.subtitle') }}
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://assets.coreasia.id/CoreAsia-Download-Manager.dmg"
                class="ca-btn-primary"
              >
                {{ t('solutions.downloader.hero.ctaPrimary') }}
                <Icon name="lucide:arrow-down-to-line" class="h-4 w-4" />
              </a>
              <NuxtLink to="#harga" class="ca-btn-secondary">
                {{ t('solutions.downloader.hero.ctaSecondary') }}
              </NuxtLink>
            </div>

            <div class="mt-6 flex flex-wrap gap-2">
              <span v-for="chip in heroChips" :key="chip" class="ca-chip">
                {{ chip }}
              </span>
            </div>
          </div>

          <aside ref="heroAside" class="ca-card p-5 sm:p-6">
            <p class="text-xs uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
              {{ t('solutions.downloader.workflowAside.label') }}
            </p>
            <h2 class="mt-2 text-xl font-display font-bold text-[var(--ca-text)]">
              {{ t('solutions.downloader.workflowAside.title') }}
            </h2>

            <div class="mt-5 space-y-3">
              <article
                v-for="item in workflowAsideItems"
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
        <div class="mb-8">
          <span class="ca-kicker">{{ t('solutions.downloader.features.label') }}</span>
          <h2 class="ca-title mt-4">{{ t('solutions.downloader.features.title') }}</h2>
          <p class="ca-copy mt-3 max-w-3xl">
            {{ t('solutions.downloader.features.subtitle') }}
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="(feature, index) in features"
            :key="feature.title"
            :ref="revealRef('fadeUp', index * 80)"
            class="ca-card-soft p-5"
          >
            <div
              class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]"
            >
              <Icon :name="feature.icon" class="h-5 w-5 ca-tone-gold" />
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

    <!-- Cara Pakai — langkah demi langkah (visual) -->
    <section id="cara-pakai" class="ca-section pt-0">
      <div class="ca-container">
        <div class="mb-8 text-center">
          <span class="ca-kicker">{{ t('solutions.downloader.workflow.label') }}</span>
          <h2 class="ca-title mt-4">{{ t('solutions.downloader.workflow.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">
            {{ t('solutions.downloader.workflow.subtitle') }}
          </p>
        </div>

        <!-- selalu 1 baris; di layar sempit horizontal-scroll (kartu tak menyusut) -->
        <div class="flex gap-5 overflow-x-auto pb-3 snap-x [scrollbar-width:thin]">
          <!-- Langkah 1 -->
          <article :ref="revealRef('fadeUp', 0)" class="ca-card overflow-hidden p-0 shrink-0 grow basis-[260px] snap-start">
            <div class="border-b border-[color:var(--ca-border)]">
              <svg viewBox="0 0 320 200" class="block w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="320" height="200" fill="#F6F3EC" />
                <rect x="52" y="66" width="64" height="64" rx="16" fill="#F59E0B" />
                <path d="M84 82v30m0 0l-11-11m11 11l11-11" stroke="#14213D" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                <text x="84" y="150" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" font-weight="700" fill="#14213D">CoreAsia</text>
                <path d="M132 100h46" stroke="#C9BFA6" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round" />
                <path d="M174 92l11 8-11 8" stroke="#C9BFA6" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                <rect x="204" y="84" width="78" height="52" rx="10" fill="#B9CDF0" />
                <path d="M204 94a10 10 0 0 1 10-10h16l7 8h35a10 10 0 0 1 10 10v2h-78z" fill="#9DB8E8" />
                <text x="243" y="158" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="10" font-weight="600" fill="#14213D">Applications</text>
              </svg>
            </div>
            <div class="p-5">
              <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] text-sm font-bold ca-tone-gold">1</span>
              <h3 class="mt-3 text-base font-display font-semibold text-[var(--ca-text)]">{{ workflowSteps[0]?.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                {{ workflowSteps[0]?.description }}
              </p>
            </div>
          </article>

          <!-- Langkah 2: Pasang extension browser -->
          <article :ref="revealRef('fadeUp', 100)" class="ca-card overflow-hidden p-0 shrink-0 grow basis-[260px] snap-start">
            <div class="border-b border-[color:var(--ca-border)]">
              <svg viewBox="0 0 320 200" class="block w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="320" height="200" fill="#F6F3EC" />
                <rect x="30" y="30" width="260" height="140" rx="12" fill="#ffffff" stroke="#E4DECF" />
                <path d="M30 42a12 12 0 0 1 12-12h236a12 12 0 0 1 12 12v14H30z" fill="#F1EEE7" />
                <circle cx="46" cy="43" r="3" fill="#E2553B" /><circle cx="57" cy="43" r="3" fill="#F2B23B" /><circle cx="68" cy="43" r="3" fill="#3FB665" />
                <rect x="86" y="37" width="120" height="12" rx="6" fill="#E7E2D6" />
                <rect x="222" y="36" width="20" height="14" rx="4" fill="#ffffff" stroke="#E4DECF" />
                <path d="M226 39h12v8h-12zm0 4h4v4h4v-4h4" stroke="#C9BFA6" stroke-width="1.4" fill="none" stroke-linejoin="round" />
                <rect x="250" y="34" width="28" height="18" rx="6" fill="#F4B431" stroke="#E1962A" />
                <path d="M259 39h10v3h-4v3h-3v-3h-3z" fill="#14213D" />
                <circle cx="263.5" cy="46.5" r="2.4" fill="#14213D" />
                <rect x="50" y="74" width="130" height="80" rx="10" fill="#FBF6EC" stroke="#EFE6D2" />
                <path d="M115 96a14 14 0 0 1 14 14v6h-12a8 8 0 0 0-8 8v6h-6a14 14 0 0 1-14-14h6a6 6 0 0 0 6-6v-4a14 14 0 0 1 14-14z" fill="#F59E0B" />
                <circle cx="115" cy="100" r="7" fill="#F4B431" stroke="#E1962A" />
                <rect x="196" y="82" width="78" height="64" rx="10" fill="#14213D" />
                <text x="235" y="106" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="10" font-weight="700" fill="#F4B431">Add to</text>
                <text x="235" y="120" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="10" font-weight="700" fill="#ffffff">Chrome / Edge</text>
                <rect x="210" y="128" width="50" height="10" rx="5" fill="#F4B431" />
              </svg>
            </div>
            <div class="p-5">
              <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] text-sm font-bold ca-tone-gold">2</span>
              <h3 class="mt-3 text-base font-display font-semibold text-[var(--ca-text)]">{{ workflowSteps[1]?.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                {{ workflowSteps[1]?.description }}
              </p>
            </div>
          </article>

          <!-- Langkah 3: Klik di browser -->
          <article :ref="revealRef('fadeUp', 200)" class="ca-card overflow-hidden p-0 shrink-0 grow basis-[260px] snap-start">
            <div class="border-b border-[color:var(--ca-border)]">
              <svg viewBox="0 0 320 200" class="block w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="320" height="200" fill="#EEF1F5" />
                <rect x="22" y="28" width="276" height="146" rx="12" fill="#ffffff" stroke="#DDE3EC" />
                <path d="M22 40a12 12 0 0 1 12-12h252a12 12 0 0 1 12 12v12H22z" fill="#F5F7FA" />
                <circle cx="38" cy="40" r="3" fill="#E2553B" /><circle cx="49" cy="40" r="3" fill="#F2B23B" /><circle cx="60" cy="40" r="3" fill="#3FB665" />
                <rect x="78" y="34" width="150" height="12" rx="6" fill="#E7ECF3" />
                <rect x="42" y="66" width="196" height="96" rx="8" fill="#14213D" />
                <circle cx="140" cy="114" r="19" fill="#ffffff" fill-opacity="0.16" />
                <path d="M134 105l15 9-15 9z" fill="#ffffff" />
                <rect x="186" y="60" width="96" height="26" rx="13" fill="#F4B431" stroke="#E1962A" />
                <path d="M201 67v8m0 0l-3.5-3.5m3.5 3.5l3.5-3.5" stroke="#14213D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                <text x="247" y="76" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="10.5" font-weight="800" fill="#14213D">CA Download</text>
              </svg>
            </div>
            <div class="p-5">
              <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] text-sm font-bold ca-tone-gold">3</span>
              <h3 class="mt-3 text-base font-display font-semibold text-[var(--ca-text)]">{{ workflowSteps[2]?.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                {{ workflowSteps[2]?.description }}
              </p>
            </div>
          </article>

          <!-- Langkah 4: Pilih kualitas & unduh -->
          <article :ref="revealRef('fadeUp', 300)" class="ca-card overflow-hidden p-0 shrink-0 grow basis-[260px] snap-start">
            <div class="border-b border-[color:var(--ca-border)]">
              <svg viewBox="0 0 320 200" class="block w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="320" height="200" fill="#F6F3EC" />
                <rect x="44" y="20" width="232" height="160" rx="16" fill="#ffffff" stroke="#E4DECF" />
                <path d="M68 44v9m0 0l-4-4m4 4l4-4" stroke="#F59E0B" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
                <text x="80" y="50" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" font-weight="800" fill="#14213D">Download with CoreAsia</text>
                <text x="64" y="73" font-family="ui-sans-serif,system-ui,sans-serif" font-size="7.5" font-weight="700" letter-spacing="0.6" fill="#8A8674">FILE NAME</text>
                <rect x="64" y="79" width="192" height="20" rx="7" fill="#F1EEE7" stroke="#E4DECF" />
                <text x="74" y="92.5" font-family="ui-sans-serif,system-ui,sans-serif" font-size="9" fill="#5B5848">video.mp4</text>
                <text x="64" y="118" font-family="ui-sans-serif,system-ui,sans-serif" font-size="7.5" font-weight="700" letter-spacing="0.6" fill="#8A8674">QUALITY</text>
                <rect x="64" y="124" width="192" height="20" rx="7" fill="#ffffff" stroke="#E4DECF" />
                <text x="74" y="137.5" font-family="ui-sans-serif,system-ui,sans-serif" font-size="9" fill="#14213D">Best available</text>
                <path d="M240 132l4 4 4-4" stroke="#8A8674" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                <rect x="64" y="156" width="192" height="22" rx="11" fill="#F4B431" />
                <text x="160" y="170.5" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="10" font-weight="800" fill="#14213D">Download</text>
              </svg>
            </div>
            <div class="p-5">
              <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] text-sm font-bold ca-tone-gold">4</span>
              <h3 class="mt-3 text-base font-display font-semibold text-[var(--ca-text)]">{{ workflowSteps[3]?.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                {{ workflowSteps[3]?.description }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <span class="ca-kicker">{{ t('solutions.downloader.platforms.label') }}</span>
            <h2 class="ca-title mt-4">{{ t('solutions.downloader.platforms.title') }}</h2>
            <p class="ca-copy mt-4 max-w-2xl">
              {{ t('solutions.downloader.platforms.subtitle') }}
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <article
              v-for="platform in platforms"
              :key="platform.title"
              class="ca-card p-5"
              :class="platform.available ? '' : 'opacity-70'"
            >
              <div class="flex items-start justify-between gap-3">
                <div
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)]"
                >
                  <Icon :name="platform.icon" class="h-4 w-4 ca-tone-gold" />
                </div>
                <span
                  v-if="platform.available"
                  class="ca-pill-emerald px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]"
                >
                  {{ platform.badge }}
                </span>
                <span
                  v-else
                  class="shrink-0 rounded-full border border-[color:var(--ca-border)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-muted)]"
                >
                  {{ platform.badge }}
                </span>
              </div>
              <h3 class="mt-4 text-base font-display font-semibold text-[var(--ca-text)]">
                {{ platform.title }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                {{ platform.description }}
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section id="harga" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="pricingHeader" class="mb-8 text-center">
          <span class="ca-kicker">{{ t('solutions.downloader.pricing.label') }}</span>
          <h2 class="ca-title mt-4">{{ t('solutions.downloader.pricing.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">
            {{ t('solutions.downloader.pricing.subtitle') }}
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <article
            v-for="(plan, index) in pricingPlans"
            :key="plan.name"
            :ref="revealRef('fadeUp', index * 100)"
            class="ca-card flex flex-col p-5 transition"
            :class="plan.popular ? 'ring-2 ring-[color:var(--ca-gold-border)]' : ''"
          >
            <div v-if="plan.popular" class="mb-3">
              <span
                class="ca-pill-gold px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]"
              >
                {{ t('solutions.downloader.pricing.popularLabel') }}
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
            <ul class="mt-4 flex-1 space-y-2">
              <li
                v-for="feature in plan.features"
                :key="feature"
                class="flex items-start gap-2 text-sm text-[var(--ca-muted)]"
              >
                <Icon name="lucide:check" class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 ca-tone-gold" />
                <span>{{ feature }}</span>
              </li>
            </ul>
            <a
              v-if="plan.action === 'download'"
              href="https://assets.coreasia.id/CoreAsia-Download-Manager.dmg"
              class="mt-5"
              :class="plan.popular ? 'ca-btn-primary' : 'ca-btn-secondary'"
            >
              {{ plan.cta }}
            </a>
            <button
              v-else-if="plan.action === 'buy'"
              type="button"
              class="mt-5"
              :class="plan.popular ? 'ca-btn-primary' : 'ca-btn-secondary'"
              @click="buyNow(plan.fsPath)"
            >
              {{ plan.cta }}
            </button>
            <button
              v-else
              type="button"
              disabled
              class="mt-5 ca-btn-secondary opacity-50 cursor-not-allowed"
            >
              {{ t('solutions.downloader.pricing.soonLabel') }}
            </button>
          </article>
        </div>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="mb-8">
          <span class="ca-kicker">{{ t('solutions.downloader.privacy.label') }}</span>
          <h2 class="ca-title mt-4">{{ t('solutions.downloader.privacy.title') }}</h2>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <article
            v-for="(point, index) in privacyPoints"
            :key="point.title"
            :ref="revealRef('fadeUp', index * 100)"
            class="ca-card p-5"
          >
            <div
              class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]"
            >
              <Icon :name="point.icon" class="h-5 w-5 ca-tone-emerald" />
            </div>
            <h3 class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]">
              {{ point.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ point.description }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- Related Products -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <h3 class="mb-6 text-center font-display text-xl font-bold text-[var(--ca-text)]">
          {{ t('solutions.downloader.related.title') }}
        </h3>
        <div class="grid gap-4 sm:grid-cols-3">
          <NuxtLink
            v-for="item in relatedItems"
            :key="item.to"
            :to="item.to"
            class="ca-card-soft p-5 transition hover:-translate-y-0.5"
          >
            <Icon :name="item.icon" class="mb-2 h-5 w-5 text-[var(--ca-kicker)]" />
            <p class="text-sm font-semibold text-[var(--ca-text)]">{{ item.title }}</p>
            <p class="mt-1 text-xs text-[var(--ca-muted)]">{{ item.description }}</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="ctaSection" class="ca-card p-6 text-center sm:p-10">
          <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
            {{ t('solutions.downloader.cta.title') }}
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
            {{ t('solutions.downloader.cta.subtitle') }}
          </p>
          <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="https://assets.coreasia.id/CoreAsia-Download-Manager.dmg"
              class="ca-btn-primary"
            >
              {{ t('solutions.downloader.cta.ctaPrimary') }}
              <Icon name="lucide:arrow-down-to-line" class="h-4 w-4" />
            </a>
            <a :href="LINKS.email" class="ca-btn-secondary">
              {{ t('solutions.downloader.cta.ctaSecondary') }}
            </a>
          </div>
          <p class="mt-6 text-xs text-[var(--ca-muted)]">
            {{ t('solutions.downloader.cta.termsPrefix') }}
            <NuxtLink to="/downloader/terms" class="ca-link-accent">{{ t('solutions.downloader.cta.termsLabel') }}</NuxtLink>,
            <NuxtLink to="/downloader/privacy" class="ca-link-accent">{{ t('solutions.downloader.cta.privacyLabel') }}</NuxtLink>
            <span v-html="t('solutions.downloader.cta.termsAnd')" />
            <NuxtLink to="/downloader/refund" class="ca-link-accent">{{ t('solutions.downloader.cta.refundLabel') }}</NuxtLink>
            {{ t('solutions.downloader.cta.termsSuffix') }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
