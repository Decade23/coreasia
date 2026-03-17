<script setup lang="ts">
import { LINKS } from '~/utils/constants'

const { t } = useCoreI18n()

useCoreSeo({
  title: t('solutions.custom.title') as string,
  description: t('solutions.custom.description') as string,
  path: '/products/build',
})

useSchemaOrg([
  defineWebPage({
    name: 'Build by CoreAsia',
  }),
])

const features = computed(
  () => (t('solutions.custom.detailedFeatures') as Array<Record<string, string>>) || [],
)
const audienceItems = computed(
  () => (t('solutions.custom.audience.items') as Array<Record<string, string>>) || [],
)
const processItems = computed(
  () => (t('solutions.custom.process.items') as Array<Record<string, string>>) || [],
)
const techStack = computed(
  () => (t('solutions.custom.techStack.items') as string[]) || [],
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
          class="absolute inset-0 bg-[radial-gradient(880px_460px_at_95%_10%,rgba(139,92,246,0.14),transparent_64%)]"
        />
      </div>

      <div class="ca-container relative ca-section pt-6 sm:pt-8 lg:py-28">
        <div class="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <span class="ca-kicker">
              <Icon name="lucide:code-2" class="h-3.5 w-3.5 ca-tone-gold" />
              {{ t('solutions.custom.kicker') }}
            </span>
            <h1
              class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.45rem]"
              v-html="t('solutions.custom.hero.title')"
            />
            <p class="ca-copy mt-5 max-w-2xl">
              {{ t('solutions.custom.hero.subtitle') }}
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <NuxtLink to="/contact?subject=custom" class="ca-btn-primary">
                {{ t('solutions.custom.hero.ctaPrimary') }}
                <Icon name="lucide:arrow-right" class="h-4 w-4" />
              </NuxtLink>
              <a
                :href="LINKS.whatsapp"
                target="_blank"
                rel="noopener noreferrer"
                class="ca-btn-secondary"
              >
                {{ t('solutions.custom.hero.ctaSecondary') }}
              </a>
            </div>

            <div class="mt-6 flex flex-wrap gap-2">
              <span
                v-for="chip in (t('solutions.custom.hero.chips') as string[])"
                :key="chip"
                class="ca-chip"
              >
                {{ chip }}
              </span>
            </div>
          </div>

          <aside class="ca-card p-5 sm:p-6">
            <p class="text-xs uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
              {{ t('solutions.custom.process.label') }}
            </p>
            <h2 class="mt-2 text-xl font-display font-bold text-[var(--ca-text)]">
              {{ t('solutions.custom.process.title') }}
            </h2>

            <div class="mt-5 space-y-3">
              <article
                v-for="item in processItems"
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

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="feature in features"
            :key="feature.title"
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

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <span class="ca-kicker">{{ t('solutions.custom.audience.label') }}</span>
            <h2 class="ca-title mt-4">{{ t('solutions.custom.audience.title') }}</h2>
            <p class="ca-copy mt-4 max-w-2xl">{{ t('solutions.custom.audience.subtitle') }}</p>
          </div>

          <div class="grid gap-3">
            <article
              v-for="item in audienceItems"
              :key="item.title"
              class="ca-card p-5"
            >
              <div
                class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)]"
              >
                <Icon :name="item.icon" class="h-4 w-4 ca-tone-gold" />
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
        <div class="ca-card p-5 sm:p-6">
          <span class="ca-kicker">{{ t('solutions.custom.techStack.label') }}</span>
          <h2 class="mt-3 text-xl font-display font-bold text-[var(--ca-text)]">
            {{ t('solutions.custom.techStack.title') }}
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">
            {{ t('solutions.custom.techStack.subtitle') }}
          </p>
          <div class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="tech in techStack"
              :key="tech"
              class="rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-3 py-1.5 text-sm font-medium text-[var(--ca-text)]"
            >
              {{ tech }}
            </span>
            <span class="rounded-lg border border-dashed border-[color:var(--ca-border)] px-3 py-1.5 text-sm text-[var(--ca-muted)]">
              {{ t('solutions.custom.techStack.moreLabel') }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="ca-card p-6 text-center sm:p-10">
          <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
            {{ t('solutions.custom.cta.title') }}
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
            {{ t('solutions.custom.cta.subtitle') }}
          </p>
          <div class="mt-6">
            <NuxtLink to="/contact?subject=custom" class="ca-btn-primary">
              {{ t('solutions.custom.cta.button') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
