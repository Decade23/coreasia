<script setup lang="ts">
import { LINKS } from '~/utils/constants'
import { getArticleBySlug, ARTICLES } from '~/utils/articles'

interface PublicArticle {
  id: string
  slug: string
  title: string
  description: string
  content: string
  category: string
  tags: string[]
  author: string
  read_time: number
  featured_image: string | null
  published_at: string
  created_at: string
}

interface ProductSpotlight {
  name: string
  tagline: string
  description: string
  to: string
  icon: string
  badge: string
  ctaLabel: string
  features: string[]
}

interface ProductRoadmapItem {
  name: string
  tagline: string
  description: string
  badge: string
}

const { locale, t } = useCoreI18n()
const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string
const config = useRuntimeConfig()
const baseURL = import.meta.client
  ? (config.public?.gatewayPublicUrl || 'http://localhost:8084/api')
  : (config.public?.gatewayUrl || 'http://localhost:8081/api')
const siteOrigin = useSiteOrigin()

const normalizeCategoryKey = (value: string | null | undefined) => {
  const normalized = (value || '').trim().toLowerCase()
  if (normalized === 'business') return 'bisnis'
  return normalized
}

const toPublicArticle = (item: any): PublicArticle => ({
  id: item.id || item.slug,
  slug: item.slug,
  title: item.title,
  description: item.description,
  content: item.content || '',
  category: item.category,
  tags: item.tags || [],
  author: item.author || (t('blog.defaultAuthor') as string) || 'Tim CoreAsia',
  read_time: item.read_time || item.readTime || 5,
  featured_image: item.featured_image || item.featuredImage || null,
  published_at: item.published_at || item.publishedAt || item.created_at || new Date().toISOString(),
  created_at: item.created_at || item.publishedAt || item.published_at || new Date().toISOString(),
})

const staticArticle = getArticleBySlug(slug)

const fetchArticleFromApi = async () => {
  try {
    const res = await $fetch<{ data: any }>(`${baseURL}/articles/${slug}`, {
      timeout: 1800,
    })
    return res?.data || null
  } catch {
    return null
  }
}

const { data: articleData } = await useAsyncData(`article-${slug}`, async () => {
  if (import.meta.server && staticArticle) {
    return staticArticle
  }

  const apiArticle = await fetchArticleFromApi()
  return apiArticle || staticArticle || null
})

const article = computed(() => articleData.value ? toPublicArticle(articleData.value) : null)

if (!article.value) {
  throw createError({ statusCode: 404, message: 'Article not found' })
}

if (import.meta.client && staticArticle) {
  onMounted(async () => {
    const apiArticle = await fetchArticleFromApi()
    if (apiArticle) {
      articleData.value = apiArticle
    }
  })
}

const articleCategoryKey = computed(() => normalizeCategoryKey(article.value?.category))

useCoreSeo({
  title: article.value.title,
  description: article.value.description,
  path: `/artikel/${slug}`,
  ogType: 'article',
})

useSchemaOrg([
  defineWebPage({ name: article.value.title, description: article.value.description }),
])

useHead(() => ({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.value?.title,
      description: article.value?.description,
      datePublished: article.value?.published_at || article.value?.publishedAt,
      author: {
        '@type': 'Organization',
        name: 'CoreAsia Teknologi',
        url: siteOrigin.value,
      },
      publisher: {
        '@type': 'Organization',
        name: 'CoreAsia Teknologi',
        url: siteOrigin.value,
        logo: {
          '@type': 'ImageObject',
          url: `${siteOrigin.value}/logos/logo-512.webp`,
        },
      },
      mainEntityOfPage: `${siteOrigin.value}/artikel/${slug}`,
      inLanguage: locale.value === 'en' ? 'en' : 'id',
    }),
  }],
}))

const fetchRelatedArticlesFromApi = async () => {
  try {
    const params = new URLSearchParams({ per_page: '6' })
    if (articleCategoryKey.value) {
      params.set('category', articleCategoryKey.value)
    }

    const res = await $fetch<{ data: PublicArticle[] }>(`${baseURL}/articles?${params.toString()}`, {
      timeout: 1200,
    })

    return res?.data || []
  } catch {
    return []
  }
}

const { data: relatedApiArticles } = await useAsyncData(`article-related-${slug}`, async () => {
  if (import.meta.server && staticArticle) {
    return []
  }

  return fetchRelatedArticlesFromApi()
}, {
  default: () => [],
})

if (import.meta.client) {
  onMounted(async () => {
    if (!relatedApiArticles.value?.length) {
      relatedApiArticles.value = await fetchRelatedArticlesFromApi()
    }
  })
}

const dateLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'id-ID'))

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(dateLocale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

const categoryLabel = (key: string) => {
  const cats = t('blog.categories') as Record<string, string>
  return cats[key] || cats.business || key
}

const getPublishDate = (item: any) => item.published_at || item.publishedAt || item.created_at
const getReadTime = (item: any) => item.read_time || item.readTime || 5
const getTags = (item: any) => item.tags || []

const relatedArticles = computed(() => {
  const seen = new Set<string>([slug])
  const merged: PublicArticle[] = []

  for (const source of [relatedApiArticles.value || [], ARTICLES.map(toPublicArticle)]) {
    for (const item of source as PublicArticle[]) {
      const articleItem = toPublicArticle(item)
      if (!articleItem.slug || seen.has(articleItem.slug)) continue
      seen.add(articleItem.slug)
      merged.push(articleItem)
    }
  }

  return merged
    .sort((left, right) => {
      const leftScore = normalizeCategoryKey(left.category) === articleCategoryKey.value ? 0 : 1
      const rightScore = normalizeCategoryKey(right.category) === articleCategoryKey.value ? 0 : 1

      if (leftScore !== rightScore) {
        return leftScore - rightScore
      }

      const leftDate = new Date(left.published_at || left.created_at).getTime()
      const rightDate = new Date(right.published_at || right.created_at).getTime()
      return rightDate - leftDate
    })
    .slice(0, 3)
})

const productSpotlights = computed<ProductSpotlight[]>(() => {
  const products = ((t('home.products.items') as Array<Record<string, any>>) || []).slice(0, 3)

  return products.map((product, index) => ({
    name: product.name,
    tagline: product.tagline,
    description: product.heroDesc || product.description,
    to: product.to,
    icon: index === 0
      ? 'lucide:activity'
      : index === 1
        ? 'lucide:code-2'
        : 'lucide:boxes',
    badge: product.badge || '',
    ctaLabel: product.ctaLabel || (t('blog.readMore') as string),
    features: (product.features || []).slice(0, 3),
  }))
})

const productRoadmap = computed<ProductRoadmapItem[]>(() => {
  const nextProducts = ((t('home.products.comingSoon') as Array<Record<string, any>>) || []).slice(0, 2)

  return nextProducts.map((product) => ({
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    badge: product.badge || '',
  }))
})

const goToArticles = async () => {
  if (import.meta.server) {
    await navigateTo('/artikel')
    return
  }

  try {
    await router.push('/artikel')
  } catch {
    // Fall through to a hard navigation if the client router gets stuck.
  }

  if (window.location.pathname !== '/artikel') {
    window.location.assign('/artikel')
  }
}
</script>

<template>
  <div v-if="article">
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(920px_420px_at_50%_0%,rgba(251,191,36,0.12),transparent_62%)]" />
      </div>
      <div class="ca-container relative ca-section pt-6 sm:pt-8 pb-10 sm:pb-12 lg:pb-16">
        <div class="mx-auto max-w-3xl">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ca-muted)] transition hover:text-[var(--ca-text)]"
            @click="goToArticles"
          >
            <Icon name="lucide:arrow-left" class="h-4 w-4" /> {{ t('blog.kicker') }}
          </button>
          <div class="mt-5 flex flex-wrap items-center gap-3">
            <span class="rounded-md bg-[var(--ca-kicker-bg)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-primary">{{ categoryLabel(article.category) }}</span>
            <span class="text-xs text-[var(--ca-subtle)]">{{ getReadTime(article) }} {{ t('blog.readTime') }}</span>
            <span class="text-xs text-[var(--ca-subtle)]">{{ formatDate(getPublishDate(article)) }}</span>
          </div>
          <h1 class="mt-4 text-balance font-display text-3xl font-bold leading-[1.12] text-[var(--ca-text)] sm:text-4xl lg:text-[3rem]">{{ article.title }}</h1>
          <p class="ca-copy mt-4 max-w-2xl">{{ article.description }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span v-for="tag in getTags(article)" :key="tag" class="ca-chip">{{ tag }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <article class="mx-auto max-w-4xl">
          <NuxtImg
            v-if="article.featured_image"
            :src="article.featured_image"
            :alt="article.title"
            loading="lazy"
            format="webp"
            class="mb-8 aspect-[16/9] w-full rounded-[1.75rem] object-cover shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
          />
          <ArticleCoverPlaceholder
            v-else
            :title="article.title"
            :category="categoryLabel(article.category)"
            class="mb-8 rounded-[1.75rem]"
          />
          <ArticleContentRenderer :content="article.content" />
        </article>
      </div>
    </section>

    <!-- Related Articles -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="mx-auto max-w-4xl">
          <div class="mb-8 flex items-center gap-3">
            <div class="h-px flex-1 bg-[var(--ca-border)]" />
            <span class="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--ca-subtle)]">{{ t('blog.relatedTitle') }}</span>
            <div class="h-px flex-1 bg-[var(--ca-border)]" />
          </div>

          <div v-if="relatedArticles.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="item in relatedArticles"
              :key="item.slug"
              :to="`/artikel/${item.slug}`"
              class="group flex flex-col overflow-hidden rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)] hover:shadow-[var(--ca-card-soft-shadow)]"
            >
              <div class="relative overflow-hidden">
                <NuxtImg
                  v-if="item.featured_image"
                  :src="item.featured_image"
                  :alt="item.title"
                  loading="lazy"
                  format="webp"
                  class="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <ArticleCoverPlaceholder
                  v-else
                  :title="item.title"
                  :category="categoryLabel(item.category)"
                  class="aspect-[16/10] w-full"
                />
                <span class="absolute left-3 top-3 rounded-md bg-[rgba(8,12,22,0.82)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[var(--ca-gold-text)] backdrop-blur-sm">
                  {{ categoryLabel(item.category) }}
                </span>
              </div>

              <div class="flex flex-1 flex-col p-4">
                <div class="flex items-center gap-2 text-[0.7rem] text-[var(--ca-subtle)]">
                  <span>{{ formatDate(getPublishDate(item)) }}</span>
                  <span class="inline-block h-0.5 w-0.5 rounded-full bg-[var(--ca-subtle)]" />
                  <span>{{ getReadTime(item) }} {{ t('blog.readTime') }}</span>
                </div>
                <h3 class="mt-2.5 text-balance font-display text-[0.95rem] font-bold leading-snug text-[var(--ca-text)] line-clamp-2 group-hover:text-[var(--ca-gold-text)] transition-colors duration-200">{{ item.title }}</h3>
                <p class="mt-1.5 text-[0.8rem] leading-relaxed text-[var(--ca-muted)] line-clamp-2">{{ item.description }}</p>

                <div class="mt-auto pt-4 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold ca-tone-gold">
                  {{ t('blog.readMore') }}
                  <Icon name="lucide:arrow-right" class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>
            </NuxtLink>
          </div>

          <div v-else class="rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-5 text-center text-sm text-[var(--ca-muted)]">
            {{ t('blog.noRelatedArticles') }}
          </div>
        </div>
      </div>
    </section>

    <!-- Products -->
    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="mx-auto max-w-4xl">
          <div class="mb-8 flex items-center gap-3">
            <div class="h-px flex-1 bg-[var(--ca-border)]" />
            <span class="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--ca-subtle)]">{{ t('home.products.kicker') }}</span>
            <div class="h-px flex-1 bg-[var(--ca-border)]" />
          </div>

          <div class="text-center mb-8">
            <h2 class="font-display text-2xl font-bold text-[var(--ca-text)] sm:text-3xl">{{ t('blog.productsTitle') }}</h2>
            <p class="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--ca-muted)]">{{ t('blog.productsDescription') }}</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="product in productSpotlights"
              :key="product.to"
              :to="product.to"
              class="group relative flex flex-col overflow-hidden rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)] hover:shadow-[var(--ca-card-soft-shadow)]"
            >
              <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--ca-gold-border)_60%,transparent),transparent)]" />

              <div class="flex items-center gap-3">
                <span class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
                  <Icon :name="product.icon" class="h-4 w-4 ca-tone-gold" />
                </span>
                <div class="min-w-0">
                  <h3 class="font-display text-base font-bold leading-tight text-[var(--ca-text)]">{{ product.name }}</h3>
                  <span v-if="product.badge" class="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-gold-text)]">{{ product.badge }}</span>
                </div>
              </div>

              <p class="mt-3 text-[0.8rem] leading-relaxed text-[var(--ca-muted)] line-clamp-2">{{ product.description }}</p>

              <div v-if="product.features.length" class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-for="feature in product.features"
                  :key="feature"
                  class="rounded-md border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--ca-muted)]"
                >
                  {{ feature }}
                </span>
              </div>

              <div class="mt-auto pt-4 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold ca-tone-gold">
                {{ product.ctaLabel }}
                <Icon name="lucide:arrow-up-right" class="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </NuxtLink>
          </div>

          <div v-if="productRoadmap.length" class="mt-5 grid gap-3 sm:grid-cols-2">
            <div
              v-for="product in productRoadmap"
              :key="product.name"
              class="flex items-start gap-3 rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4"
            >
              <Icon name="lucide:sparkles" class="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--ca-gold-text)]" />
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-display text-sm font-bold text-[var(--ca-text)]">{{ product.name }}</h3>
                  <span v-if="product.badge" class="rounded-md border border-[color:var(--ca-border)] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[var(--ca-subtle)]">{{ product.badge }}</span>
                </div>
                <p class="mt-1 text-[0.78rem] leading-relaxed text-[var(--ca-muted)]">{{ product.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="ca-card p-6 text-center sm:p-10">
          <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">{{ t('blog.cta.title') }}</h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">{{ t('blog.cta.subtitle') }}</p>
          <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <NuxtLink to="/contact" class="ca-btn-primary">{{ t('blog.cta.button') }} <Icon name="lucide:arrow-right" class="h-4 w-4" /></NuxtLink>
            <a :href="LINKS.whatsapp" target="_blank" rel="noopener noreferrer" class="ca-btn-secondary"><Icon name="lucide:message-circle" class="h-4 w-4" /> WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
