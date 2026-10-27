<script setup lang="ts">
import { formatPublicArticleDate, type PublicArticle } from '~/utils/public-articles'

const { locale, t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()
definePageMeta({ middleware: 'article-language' })

const heroContent = useReveal('fadeUp')
const browseHeader = useReveal('fadeUp')
const categoryControls = useReveal('fadeUp', 80)
const ctaSection = useReveal('scaleUp')

useCoreSeo({
  title: (t('blog.title') || 'Artikel & Insight') as string,
  description: (t('blog.description') || 'Artikel seputar teknologi digital') as string,
  path: '/artikel',
})

const activeCategory = ref('all')
const categoriesExpanded = ref(false)
const collapsedCategoryLimit = 6

const categoryLabels = computed(() => (t('blog.categories') || {}) as Record<string, string>)
const normalizeCategoryKey = (value: string | null | undefined) => {
  const normalized = (value || '').trim().toLowerCase()
  if (normalized === 'business') return 'bisnis'
  return normalized
}

const { data: catalogData } = await useFetch<{ data: PublicArticle[] }>('/api/public/articles', { key: 'public-article-catalog', default: () => ({ data: [] }) })
const articles = computed(() => catalogData.value?.data || [])
const articleCatalog = articles
const loadingArticles = ref(false)

const prettifyCategoryKey = (value: string) => value
  .split(/[-_]+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ')

const resolveCategoryLabel = (value: string) => {
  const normalized = normalizeCategoryKey(value)
  const camelCaseKey = normalized.replace(/[-_]+([a-z])/g, (_, letter: string) => letter.toUpperCase())

  return categoryLabels.value[normalized]
    || categoryLabels.value[camelCaseKey]
    || prettifyCategoryKey(normalized)
}

const categories = computed(() => {
  const counts = new Map<string, number>()

  for (const article of articleCatalog.value) {
    const key = normalizeCategoryKey(article.category)
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  const dynamicCategories = Array.from(counts.entries())
    .map(([key, count]) => ({
      key,
      label: resolveCategoryLabel(key),
      count,
    }))
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count
      }

      return left.label.localeCompare(right.label, locale.value === 'en' ? 'en' : 'id')
    })
    .map(({ count, ...category }) => category)

  return [{ key: 'all', label: categoryLabels.value.all || 'Semua' }, ...dynamicCategories]
})

const hasExtraCategories = computed(() => categories.value.length > collapsedCategoryLimit)
const hiddenCategoryCount = computed(() => Math.max(categories.value.length - collapsedCategoryLimit, 0))

const visibleCategories = computed(() => {
  if (categoriesExpanded.value || !hasExtraCategories.value) {
    return categories.value
  }

  const baseCategories = categories.value.slice(0, collapsedCategoryLimit)
  if (activeCategory.value === 'all') {
    return baseCategories
  }

  if (baseCategories.some((category) => category.key === activeCategory.value)) {
    return baseCategories
  }

  const activeCategoryItem = categories.value.find((category) => category.key === activeCategory.value)
  if (!activeCategoryItem) {
    return baseCategories
  }

  return [...baseCategories.slice(0, Math.max(1, collapsedCategoryLimit - 1)), activeCategoryItem]
})

const filteredArticles = computed(() => {
  if (activeCategory.value === 'all') return articles.value
  return articles.value.filter((article) => normalizeCategoryKey(article.category) === activeCategory.value)
})

watch(categories, (nextCategories) => {
  if (!nextCategories.some((category) => category.key === activeCategory.value)) {
    activeCategory.value = 'all'
  }
})

const dateLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'id-ID'))

const formatDate = (dateStr: string) => formatPublicArticleDate(dateStr, dateLocale.value)

const categoryLabel = (key: string) => {
  return resolveCategoryLabel(key)
}
</script>

<template>
  <div>
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(920px_420px_at_50%_0%,rgba(251,191,36,0.15),transparent_62%)]" />
      </div>
      <div ref="heroContent" class="ca-container relative ca-section pt-6 sm:pt-8 pb-10 text-center sm:pb-12 lg:pb-16">
        <span class="ca-kicker">
          <Icon name="lucide:pen-tool" class="h-3.5 w-3.5 ca-tone-gold" />
          {{ t('blog.kicker') }}
        </span>
        <h1 class="mx-auto mt-5 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.4rem]" v-html="t('blog.hero.title')" />
        <p class="ca-copy mx-auto mt-5 max-w-2xl">{{ t('blog.hero.subtitle') }}</p>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="browseHeader" class="mb-4">
          <p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ca-subtle)]">{{ t('blog.browseLabel') }}</p>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ca-muted)]">{{ t('blog.browseDescription') }}</p>
        </div>

        <div ref="categoryControls" class="mb-8 rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)]/80 p-2.5">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in visibleCategories"
              :key="cat.key"
              type="button"
              class="inline-flex items-center whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
              :class="activeCategory === cat.key ? 'bg-[var(--ca-kicker-bg)] text-brand-primary shadow-[0_8px_24px_rgba(245,158,11,0.12)]' : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]'"
              @click="activeCategory = cat.key"
            >
              <span>{{ cat.label }}</span>
            </button>
          </div>

          <div v-if="hasExtraCategories" class="mt-2 border-t border-[color:var(--ca-border)]/70 pt-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--ca-muted)] transition hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]"
              @click="categoriesExpanded = !categoriesExpanded"
            >
              <span>{{ categoriesExpanded ? t('blog.showLessTopics') : t('blog.showMoreTopics') }}</span>
              <span v-if="!categoriesExpanded" class="rounded-full border border-[color:var(--ca-border)] px-2 py-0.5 text-[0.68rem] font-bold text-[var(--ca-subtle)]">
                +{{ hiddenCategoryCount }}
              </span>
              <Icon :name="categoriesExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div v-if="loadingArticles" class="py-10 text-center">
          <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
        </div>

        <div v-else-if="filteredArticles.length" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
v-for="(article, index) in filteredArticles" :key="article.slug" :ref="revealRef('fadeUp', index * 80)" :to="`/artikel/${article.slug}`"
            class="ca-card-soft group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:border-[color:var(--ca-gold-border)] hover:shadow-lg"
          >
            <ArticleCover :slug="article.slug" :title="article.title" :image="article.featured_image" class="transition group-hover:scale-[1.02]" />

            <div class="flex flex-1 flex-col p-5">
              <div class="flex items-center gap-2">
                <span class="rounded-md bg-[var(--ca-kicker-bg)] px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-primary">
                  {{ categoryLabel(article.category) }}
                </span>
                <span class="text-xs text-[var(--ca-subtle)]">{{ article.read_time }} {{ t('blog.readTime') }}</span>
              </div>
              <h2 class="mt-3 text-lg font-display font-bold leading-snug text-[var(--ca-text)]">{{ article.title }}</h2>
              <p class="mt-2 flex-1 text-sm leading-relaxed text-[var(--ca-muted)] line-clamp-3">{{ article.description }}</p>
              <div class="mt-4 flex items-center justify-between gap-3">
                <span class="text-xs text-[var(--ca-subtle)]">{{ formatDate(article.published_at || article.created_at) }}</span>
                <span class="inline-flex items-center gap-1 text-sm font-semibold ca-tone-gold">
                  {{ t('blog.readMore') }}
                  <Icon name="lucide:arrow-right" class="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="ca-card p-10 text-center">
          <Icon name="lucide:file-text" class="mx-auto h-12 w-12 text-[var(--ca-subtle)]" />
          <p class="mt-4 text-sm text-[var(--ca-muted)]">{{ t('blog.noArticles') }}</p>
        </div>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div ref="ctaSection" class="ca-card p-6 text-center sm:p-10">
          <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">{{ t('blog.cta.title') }}</h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">{{ t('blog.cta.subtitle') }}</p>
          <div class="mt-6">
            <NuxtLink to="/contact" class="ca-btn-primary">{{ t('blog.cta.button') }} <Icon name="lucide:arrow-right" class="h-4 w-4" /></NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
