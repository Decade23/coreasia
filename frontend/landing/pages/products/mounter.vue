<script setup lang="ts">
import { MOUNTER } from '~/utils/constants'

// Catatan internal: verifikasi klaim keamanan ("tanpa kernel extension" /
// "no system extension") terhadap build final sebelum publish.

const { t } = useCoreI18n()

const PAGE_DESCRIPTION = t('solutions.mounter.description') as string
const PAGE_URL = 'https://coreasia.id/products/mounter'

useCoreSeo({
  title: t('solutions.mounter.title') as string,
  description: PAGE_DESCRIPTION,
  path: '/products/mounter',
  image: '/social/og-mounter.png',
})

useSchemaOrg([
  defineWebPage({
    name: 'CoreAsia Mounter',
    description: PAGE_DESCRIPTION,
  }),
])

const faqItems = computed(
  () => (t('solutions.mounter.faq.items') as Array<Record<string, string>>) || [],
)

// Software application + FAQ schema untuk rich snippets
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'CoreAsia Mounter',
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
          lowPrice: '0',
          highPrice: '25',
          offerCount: 2,
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
const pricingHeader = useReveal('fadeUp')
const faqHeader = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

const heroChips = computed(
  () => (t('solutions.mounter.hero.chips') as string[]) || [],
)
const painItems = computed(
  () => (t('solutions.mounter.pain.items') as Array<Record<string, string>>) || [],
)
const securityItems = computed(
  () => (t('solutions.mounter.security.items') as Array<Record<string, string>>) || [],
)
const workflowSteps = computed(
  () => (t('solutions.mounter.workflow.steps') as Array<Record<string, string>>) || [],
)
const pricingPlans = computed(
  () => (t('solutions.mounter.pricing.plans') as Array<Record<string, any>>) || [],
)
const relatedItems = computed(
  () => (t('solutions.mounter.related.items') as Array<Record<string, string>>) || [],
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
              <Icon name="lucide:hard-drive" class="h-3.5 w-3.5 ca-tone-gold" />
              {{ t('solutions.mounter.kicker') }}
            </span>
            <h1
              class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
              v-html="t('solutions.mounter.hero.title')"
            />
            <p class="ca-copy mt-5 max-w-2xl">
              {{ t('solutions.mounter.hero.subtitle') }}
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                :href="MOUNTER.downloadUrl"
                class="ca-btn-primary"
              >
                <Icon name="lucide:download" class="h-4 w-4" />
                {{ t('solutions.mounter.hero.ctaPrimary') }}
              </a>
              <a
                :href="MOUNTER.buyUrl"
                target="_blank"
                rel="noopener"
                class="ca-btn-secondary"
              >
                {{ t('solutions.mounter.hero.ctaSecondary') }}
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
              {{ t('solutions.mounter.pain.label') }}
            </p>
            <h2 class="mt-2 text-xl font-display font-bold text-[var(--ca-text)]">
              {{ t('solutions.mounter.pain.title') }}
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

    <!-- Keamanan — checklist + engine -->
    <section id="keamanan" class="ca-section pt-0">
      <div class="ca-container">
        <div class="mb-8">
          <span class="ca-kicker">{{ t('solutions.mounter.security.label') }}</span>
          <h2 class="ca-title mt-4">{{ t('solutions.mounter.security.title') }}</h2>
          <p class="ca-copy mt-3 max-w-3xl">
            {{ t('solutions.mounter.security.subtitle') }}
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="(item, index) in securityItems"
            :key="item.title"
            :ref="revealRef('fadeUp', index * 80)"
            class="ca-card-soft p-5"
          >
            <div
              class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]"
            >
              <Icon :name="item.icon" class="h-5 w-5 ca-tone-emerald" />
            </div>
            <h3 class="mt-4 text-lg font-display font-semibold text-[var(--ca-text)]">
              {{ item.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ item.description }}
            </p>
          </article>
        </div>

        <article :ref="revealRef('fadeUp', 320)" class="ca-card mt-4 p-5 sm:p-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
            <span
              class="ca-pill-gold self-start px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]"
            >
              {{ t('solutions.mounter.security.engine.badge') }}
            </span>
            <div>
              <h3 class="text-lg font-display font-semibold text-[var(--ca-text)]">
                {{ t('solutions.mounter.security.engine.title') }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
                {{ t('solutions.mounter.security.engine.description') }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Cara Kerja — 3 langkah (visual) -->
    <section id="cara-pakai" class="ca-section pt-0">
      <div class="ca-container">
        <div class="mb-8 text-center">
          <span class="ca-kicker">{{ t('solutions.mounter.workflow.label') }}</span>
          <h2 class="ca-title mt-4">{{ t('solutions.mounter.workflow.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">
            {{ t('solutions.mounter.workflow.subtitle') }}
          </p>
        </div>

        <!-- selalu 1 baris; di layar sempit horizontal-scroll (kartu tak menyusut) -->
        <div class="flex gap-5 overflow-x-auto pb-3 snap-x [scrollbar-width:thin]">
          <!-- Langkah 1: Colok drive -->
          <article :ref="revealRef('fadeUp', 0)" class="ca-card overflow-hidden p-0 shrink-0 grow basis-[260px] snap-start">
            <div class="border-b border-[color:var(--ca-border)]">
              <svg viewBox="0 0 320 200" class="block w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="320" height="200" fill="#F6F3EC" />
                <rect x="40" y="42" width="136" height="88" rx="9" fill="#ffffff" stroke="#E4DECF" />
                <rect x="48" y="50" width="120" height="72" rx="5" fill="#14213D" />
                <rect x="48" y="50" width="120" height="12" rx="5" fill="#1E2B4F" />
                <circle cx="158" cy="56" r="2.6" fill="#F4B431" />
                <path d="M28 130h160l10 13a4 4 0 0 1-3.2 6.4H21.2A4 4 0 0 1 18 143z" fill="#E7E2D6" stroke="#DCD5C2" />
                <path d="M182 96h30" stroke="#C9BFA6" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round" />
                <path d="M206 88l11 8-11 8" stroke="#C9BFA6" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                <rect x="224" y="70" width="72" height="50" rx="10" fill="#14213D" />
                <rect x="232" y="78" width="18" height="8" rx="3" fill="#F4B431" />
                <text x="260" y="104" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13" font-weight="800" fill="#F4B431">NTFS</text>
                <rect x="230" y="126" width="60" height="6" rx="3" fill="#D9D2BF" />
                <text x="260" y="152" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="10" font-weight="600" fill="#14213D">External drive</text>
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

          <!-- Langkah 2: Klik Mount di menu bar -->
          <article :ref="revealRef('fadeUp', 100)" class="ca-card overflow-hidden p-0 shrink-0 grow basis-[260px] snap-start">
            <div class="border-b border-[color:var(--ca-border)]">
              <svg viewBox="0 0 320 200" class="block w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="320" height="200" fill="#EEF1F5" />
                <rect x="22" y="24" width="276" height="150" rx="12" fill="#ffffff" stroke="#DDE3EC" />
                <path d="M22 36a12 12 0 0 1 12-12h252a12 12 0 0 1 12 12v10H22z" fill="#F5F7FA" />
                <circle cx="222" cy="35" r="3.4" fill="#C6CEDB" />
                <circle cx="238" cy="35" r="3.4" fill="#C6CEDB" />
                <rect x="252" y="26" width="18" height="18" rx="5" fill="#F4B431" stroke="#E1962A" />
                <path d="M257 38v-5a4 4 0 0 1 8 0v5" stroke="#14213D" stroke-width="1.8" fill="none" stroke-linecap="round" />
                <rect x="168" y="52" width="120" height="104" rx="10" fill="#ffffff" stroke="#DDE3EC" />
                <text x="180" y="72" font-family="ui-sans-serif,system-ui,sans-serif" font-size="8" font-weight="700" letter-spacing="0.6" fill="#8A94A6">NTFS DRIVE</text>
                <rect x="178" y="80" width="100" height="24" rx="7" fill="#F5F7FA" stroke="#E3E8F0" />
                <rect x="184" y="86" width="13" height="12" rx="3" fill="#14213D" />
                <text x="203" y="95" font-family="ui-sans-serif,system-ui,sans-serif" font-size="9" font-weight="600" fill="#14213D">My Drive</text>
                <rect x="178" y="114" width="100" height="26" rx="13" fill="#F4B431" />
                <text x="228" y="131" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" font-weight="800" fill="#14213D">Mount</text>
                <path d="M248 130l4 15 3.6-5 6 5.4 3.2-3.2-5.4-6 5-2.8z" fill="#14213D" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />
                <rect x="46" y="72" width="96" height="64" rx="10" fill="#FBF6EC" stroke="#EFE6D2" />
                <text x="94" y="100" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="9" font-weight="700" fill="#8A8674">1 click.</text>
                <text x="94" y="114" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="9" font-weight="700" fill="#8A8674">Then automatic.</text>
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

          <!-- Langkah 3: Langsung tulis -->
          <article :ref="revealRef('fadeUp', 200)" class="ca-card overflow-hidden p-0 shrink-0 grow basis-[260px] snap-start">
            <div class="border-b border-[color:var(--ca-border)]">
              <svg viewBox="0 0 320 200" class="block w-full" xmlns="http://www.w3.org/2000/svg">
                <rect width="320" height="200" fill="#F6F3EC" />
                <rect x="28" y="24" width="264" height="150" rx="12" fill="#ffffff" stroke="#E4DECF" />
                <path d="M28 36a12 12 0 0 1 12-12h240a12 12 0 0 1 12 12v12H28z" fill="#F1EEE7" />
                <circle cx="44" cy="36" r="3" fill="#E2553B" /><circle cx="55" cy="36" r="3" fill="#F2B23B" /><circle cx="66" cy="36" r="3" fill="#3FB665" />
                <text x="160" y="40" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="9" font-weight="700" fill="#8A8674">NTFS Drive</text>
                <rect x="46" y="62" width="56" height="44" rx="8" fill="#FBF6EC" stroke="#EFE6D2" />
                <path d="M64 72h14l6 6v14a3 3 0 0 1-3 3H64a3 3 0 0 1-3-3V75a3 3 0 0 1 3-3z" fill="#B9CDF0" />
                <rect x="112" y="62" width="56" height="44" rx="8" fill="#FBF6EC" stroke="#EFE6D2" />
                <rect x="127" y="72" width="26" height="22" rx="3" fill="#9DB8E8" />
                <circle cx="135" cy="79" r="3" fill="#F6F3EC" />
                <path d="M127 90l8-7 6 5 5-4 7 7v3h-26z" fill="#14213D" fill-opacity="0.55" />
                <rect x="178" y="62" width="56" height="44" rx="8" fill="#FBF6EC" stroke="#EFE6D2" />
                <path d="M199 92v-14l10-3v14" stroke="#9DB8E8" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="196" cy="92" r="4" fill="#9DB8E8" /><circle cx="206" cy="89" r="4" fill="#9DB8E8" />
                <circle cx="262" cy="84" r="17" fill="#F4B431" stroke="#E1962A" />
                <path d="M255 91l2-6 8-8 4 4-8 8zM266 76l3 3" stroke="#14213D" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                <text x="46" y="128" font-family="ui-sans-serif,system-ui,sans-serif" font-size="7.5" font-weight="700" letter-spacing="0.6" fill="#8A8674">COPYING TO DRIVE</text>
                <rect x="46" y="134" width="228" height="10" rx="5" fill="#F1EEE7" stroke="#E4DECF" />
                <rect x="46" y="134" width="152" height="10" rx="5" fill="#F4B431" />
                <path d="M50 160l3.5 3.5 7-7" stroke="#3FB665" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                <text x="68" y="164" font-family="ui-sans-serif,system-ui,sans-serif" font-size="9" font-weight="600" fill="#14213D">Write mode enabled</text>
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
        </div>
      </div>
    </section>

    <section id="harga" class="ca-section pt-0">
      <div class="ca-container">
        <div ref="pricingHeader" class="mb-8 text-center">
          <span class="ca-kicker">{{ t('solutions.mounter.pricing.label') }}</span>
          <h2 class="ca-title mt-4">{{ t('solutions.mounter.pricing.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">
            {{ t('solutions.mounter.pricing.subtitle') }}
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
                {{ t('solutions.mounter.pricing.popularLabel') }}
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
              :href="plan.popular ? MOUNTER.buyUrl : MOUNTER.downloadUrl"
              target="_blank"
              rel="noopener"
              class="mt-5"
              :class="plan.popular ? 'ca-btn-primary' : 'ca-btn-secondary'"
            >
              {{ plan.cta }}
            </a>
          </article>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="faqHeader" class="mb-8 text-center">
          <span class="ca-kicker">{{ t('solutions.mounter.faq.label') }}</span>
          <h2 class="ca-title mt-4">{{ t('solutions.mounter.faq.title') }}</h2>
          <p class="ca-copy mx-auto mt-3 max-w-2xl">
            {{ t('solutions.mounter.faq.subtitle') }}
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-for="(faq, index) in faqItems"
            :key="faq.question"
            :ref="revealRef('fadeUp', index * 60)"
            class="ca-card-soft p-5"
          >
            <h3 class="text-sm font-semibold text-[var(--ca-text)] sm:text-base">
              {{ faq.question }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
              {{ faq.answer }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- Related Products -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <h3 class="mb-6 text-center font-display text-xl font-bold text-[var(--ca-text)]">
          {{ t('solutions.mounter.related.title') }}
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
            {{ t('solutions.mounter.cta.title') }}
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
            {{ t('solutions.mounter.cta.subtitle') }}
          </p>
          <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a :href="MOUNTER.downloadUrl" class="ca-btn-primary">
              <Icon name="lucide:download" class="h-4 w-4" />
              {{ t('solutions.mounter.cta.ctaPrimary') }}
            </a>
            <a :href="MOUNTER.supportEmail" class="ca-btn-secondary">
              {{ t('solutions.mounter.cta.ctaSecondary') }}
            </a>
          </div>
          <p class="mt-6 text-xs text-[var(--ca-muted)]">
            {{ t('solutions.mounter.cta.note') }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
