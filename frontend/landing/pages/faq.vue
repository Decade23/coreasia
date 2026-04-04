<script setup lang="ts">
const { t } = useCoreI18n()

useCoreSeo({
  title: t('faqPage.title') as string,
  description: t('faqPage.description') as string,
  path: '/faq',
})

useSchemaOrg([
  defineWebPage({ name: t('faqPage.heading') as string }),
])

// Build FAQPage schema from all categories
const allFaqs = computed(() => {
  const cats = t('faqPage.categories') as Record<string, { label: string; items: Array<{ question: string; answer: string }> }>
  const faqs: Array<{ question: string; answer: string }> = []
  for (const cat of Object.values(cats)) {
    if (cat?.items) faqs.push(...cat.items)
  }
  return faqs
})

const categories = computed(() => {
  const cats = t('faqPage.categories') as Record<string, { label: string; items: Array<{ question: string; answer: string }> }>
  return Object.entries(cats).map(([key, val]) => ({ key, ...val }))
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: allFaqs.value.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }),
    },
  ],
})

const activeCategory = ref<string | null>(null)
</script>

<template>
  <div>
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(900px_400px_at_50%_0%,rgba(59,130,246,0.12),transparent_60%)]" />
      </div>
      <div class="ca-container relative ca-section pt-6 sm:pt-8 text-center lg:py-24">
        <span class="ca-kicker">
          <Icon name="lucide:help-circle" class="h-3.5 w-3.5 ca-tone-gold" />
          {{ t('faqPage.kicker') }}
        </span>
        <h1 class="ca-title mt-5 mx-auto max-w-3xl">{{ t('faqPage.heading') }}</h1>
        <p class="ca-copy mt-4 mx-auto max-w-2xl">
          {{ t('faqPage.subtitle') }}
        </p>
      </div>
    </section>

    <!-- Category Tabs -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="flex flex-wrap justify-center gap-2 mb-8">
          <button
            class="rounded-full border px-4 py-1.5 text-sm font-medium transition"
            :class="activeCategory === null ? 'border-[color:var(--ca-gold-border)] bg-[var(--ca-kicker-bg)] text-[var(--ca-text)]' : 'border-[color:var(--ca-border)] text-[var(--ca-muted)] hover:text-[var(--ca-text)]'"
            @click="activeCategory = null"
          >
            Semua
          </button>
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="rounded-full border px-4 py-1.5 text-sm font-medium transition"
            :class="activeCategory === cat.key ? 'border-[color:var(--ca-gold-border)] bg-[var(--ca-kicker-bg)] text-[var(--ca-text)]' : 'border-[color:var(--ca-border)] text-[var(--ca-muted)] hover:text-[var(--ca-text)]'"
            @click="activeCategory = cat.key"
          >
            {{ cat.label }}
          </button>
        </div>

        <div class="mx-auto max-w-3xl space-y-4">
          <template v-for="cat in categories" :key="cat.key">
            <div v-if="activeCategory === null || activeCategory === cat.key">
              <h2 v-if="activeCategory === null" class="mb-3 text-lg font-display font-bold text-[var(--ca-text)]">
                {{ cat.label }}
              </h2>
              <div class="space-y-3">
                <article
                  v-for="faq in cat.items"
                  :key="faq.question"
                  class="rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4"
                >
                  <h3 class="text-sm font-semibold text-[var(--ca-text)] sm:text-base">{{ faq.question }}</h3>
                  <p class="mt-2 text-sm text-[var(--ca-muted)]">{{ faq.answer }}</p>
                </article>
              </div>
            </div>
          </template>
        </div>

        <p class="mt-8 text-center text-sm text-[var(--ca-muted)]">
          {{ t('faqPage.contactNote') }}
          <NuxtLink to="/contact" class="font-semibold ca-link-accent">{{ t('faqPage.contactCta') }}</NuxtLink>.
        </p>
      </div>
    </section>
  </div>
</template>
