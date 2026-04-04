<script setup lang="ts">
const { t } = useCoreI18n()

useCoreSeo({
  title: t('portfolio.title') as string,
  description: t('portfolio.description') as string,
  path: '/portfolio',
})

useSchemaOrg([
  defineWebPage({ name: t('portfolio.heading') as string }),
])

interface PortfolioItem {
  title: string
  category: string
  description: string
  tech: string[]
  link?: string
  highlights: string[]
}

const items = computed(() => (t('portfolio.items') as PortfolioItem[]) || [])
</script>

<template>
  <div>
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(900px_400px_at_50%_0%,rgba(16,185,129,0.12),transparent_60%)]" />
      </div>
      <div class="ca-container relative ca-section pt-6 sm:pt-8 text-center lg:py-24">
        <span class="ca-kicker">
          <Icon name="lucide:folder-open" class="h-3.5 w-3.5 ca-tone-gold" />
          {{ t('portfolio.kicker') }}
        </span>
        <h1 class="ca-title mt-5 mx-auto max-w-3xl">{{ t('portfolio.heading') }}</h1>
        <p class="ca-copy mt-4 mx-auto max-w-2xl">{{ t('portfolio.subtitle') }}</p>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="space-y-8">
          <article
            v-for="item in items"
            :key="item.title"
            class="ca-card overflow-hidden"
          >
            <div class="p-6 sm:p-8">
              <div class="flex flex-wrap items-center gap-3 mb-4">
                <span class="ca-chip">{{ item.category }}</span>
                <h2 class="text-xl font-display font-bold text-[var(--ca-text)] sm:text-2xl">{{ item.title }}</h2>
              </div>

              <p class="text-sm text-[var(--ca-muted)] leading-relaxed max-w-3xl">{{ item.description }}</p>

              <!-- Highlights -->
              <div class="mt-5 grid gap-2 sm:grid-cols-2">
                <div
                  v-for="highlight in item.highlights"
                  :key="highlight"
                  class="flex items-start gap-2 text-sm text-[var(--ca-text)]"
                >
                  <Icon name="lucide:check-circle-2" class="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                  <span>{{ highlight }}</span>
                </div>
              </div>

              <!-- Tech Stack -->
              <div class="mt-5 flex flex-wrap gap-1.5">
                <span
                  v-for="tech in item.tech"
                  :key="tech"
                  class="rounded-md border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--ca-subtle)]"
                >
                  {{ tech }}
                </span>
              </div>

              <!-- Link -->
              <div v-if="item.link" class="mt-5">
                <a
                  :href="item.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-sm font-semibold ca-link-accent"
                >
                  Lihat Proyek
                  <Icon name="lucide:external-link" class="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="ca-card p-6 text-center sm:p-10">
          <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
            {{ t('portfolio.cta.title') }}
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
            {{ t('portfolio.cta.subtitle') }}
          </p>
          <div class="mt-6">
            <NuxtLink to="/contact" class="ca-btn-primary">
              {{ t('portfolio.cta.button') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
