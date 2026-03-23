<script setup lang="ts">
import { ARTICLES } from '~/utils/articles'

const { locale, t } = useCoreI18n()
const config = useRuntimeConfig()
const baseURL = import.meta.client
  ? (config.public?.gatewayPublicUrl || 'http://localhost:8084/api')
  : (config.public?.gatewayUrl || 'http://localhost:8081/api')

useCoreSeo({
  title: (t('blog.title') || 'Artikel & Insight') as string,
  description: (t('blog.description') || 'Artikel seputar teknologi digital') as string,
  path: '/artikel',
})

const activeCategory = ref('all')

const categoryLabels = computed(() => (t('blog.categories') || {}) as Record<string, string>)
const normalizeCategoryKey = (value: string | null | undefined) => {
  const normalized = (value || '').trim().toLowerCase()
  if (normalized === 'business') return 'bisnis'
  return normalized
}

const categories = computed(() => [
  { key: 'all', label: categoryLabels.value.all || 'Semua' },
  { key: 'bisnis', label: categoryLabels.value.bisnis || categoryLabels.value.business || 'Bisnis & Teknologi' },
  { key: 'seo', label: categoryLabels.value.seo || 'SEO & Marketing' },
  { key: 'teknologi', label: categoryLabels.value.teknologi || 'Teknologi' },
  { key: 'marketing', label: categoryLabels.value.marketing || 'Marketing' },
  { key: 'edukasi', label: categoryLabels.value.edukasi || 'Edukasi' },
])

interface PublicArticle {
  id: string
  slug: string
  title: string
  description: string
  category: string
  tags: string[]
  author: string
  read_time: number
  featured_image: string | null
  published_at: string
  created_at: string
}

const fetchPublicArticles = async () => {
  try {
    const params: Record<string, string> = { per_page: '50' }
    if (activeCategory.value !== 'all') {
      params.category = activeCategory.value
    }
    const query = new URLSearchParams(params).toString()
    const res = await $fetch<{ data: PublicArticle[] }>(`${baseURL}/articles?${query}`, {
      timeout: 3500,
    })
    return res?.data || []
  } catch {
    return []
  }
}

const apiArticles = ref<PublicArticle[]>(import.meta.server ? await fetchPublicArticles() : [])
const loadingArticles = ref(false)
let activeRequestId = 0

const loadArticles = async (showLoader = true) => {
  const requestId = ++activeRequestId
  if (showLoader) {
    loadingArticles.value = true
  }

  const nextArticles = await fetchPublicArticles()
  if (requestId === activeRequestId) {
    apiArticles.value = nextArticles
    loadingArticles.value = false
  }
}

// Merge API articles with static fallback
const articles = computed(() => {
  if ((apiArticles.value || []).length > 0) return apiArticles.value || []
  // Fallback to static articles if API returns empty
  return ARTICLES.map(a => ({
    id: a.slug,
    slug: a.slug,
    title: a.title,
    description: a.description,
    category: a.category,
    tags: a.tags || [],
    author: a.author || (t('blog.defaultAuthor') as string) || 'Tim CoreAsia',
    read_time: a.readTime || 5,
    featured_image: null,
    published_at: a.publishedAt,
    created_at: a.publishedAt,
  }))
})

const categoryPills = computed(() => categories.value.map((category) => ({
  ...category,
  count: category.key === 'all'
    ? articles.value.length
    : articles.value.filter(item => normalizeCategoryKey(item.category) === category.key).length,
})))

const filteredArticles = computed(() => {
  if (activeCategory.value === 'all') return articles.value
  return articles.value.filter((article) => normalizeCategoryKey(article.category) === activeCategory.value)
})

onMounted(() => {
  if (!apiArticles.value.length) {
    void loadArticles(false)
  }
})

watch(activeCategory, () => {
  void loadArticles(true)
})

const dateLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'id-ID'))

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString(dateLocale.value, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch { return dateStr }
}

const categoryLabel = (key: string) => {
  return categoryLabels.value[key] || categoryLabels.value.business || key
}
</script>

<template>
  <div>
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(920px_420px_at_50%_0%,rgba(251,191,36,0.15),transparent_62%)]" />
      </div>
      <div class="ca-container relative ca-section pt-6 sm:pt-8 pb-10 text-center sm:pb-12 lg:pb-16">
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
        <div class="mb-4">
          <p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ca-subtle)]">{{ t('blog.browseLabel') }}</p>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ca-muted)]">{{ t('blog.browseDescription') }}</p>
        </div>

        <div class="-mx-4 mb-8 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          <div class="inline-flex min-w-full gap-2 rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)]/80 p-2 sm:min-w-0">
            <button
              v-for="cat in categoryPills"
              :key="cat.key"
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
              :class="activeCategory === cat.key ? 'bg-[var(--ca-kicker-bg)] text-brand-primary shadow-[0_8px_24px_rgba(245,158,11,0.12)]' : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]'"
              @click="activeCategory = cat.key"
            >
              <span>{{ cat.label }}</span>
              <span class="rounded-full border border-[color:var(--ca-border)] px-1.5 py-0.5 text-[0.66rem] font-bold text-[var(--ca-subtle)]">
                {{ cat.count }}
              </span>
            </button>
          </div>
        </div>

        <div v-if="loadingArticles" class="py-10 text-center">
          <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin text-[var(--ca-subtle)]" />
        </div>

        <div v-else-if="filteredArticles.length" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <NuxtLink v-for="article in filteredArticles" :key="article.slug" :to="`/artikel/${article.slug}`"
            class="ca-card-soft group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:border-[color:var(--ca-gold-border)] hover:shadow-lg"
          >
            <div v-if="article.featured_image" class="aspect-[16/9] w-full overflow-hidden">
              <img :src="article.featured_image" :alt="article.title" class="h-full w-full object-cover transition group-hover:scale-105" />
            </div>
            <ArticleCoverPlaceholder v-else :title="article.title" :category="categoryLabel(article.category)" />

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
        <div class="ca-card p-6 text-center sm:p-10">
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
