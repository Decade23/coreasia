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

const { data: article } = await useAsyncData(`article-${slug}`, async () => {
  try {
    const res = await $fetch<{ data: any }>(`${baseURL}/articles/${slug}`, {
      timeout: 3500,
    })
    return res?.data || null
  } catch {
    return getArticleBySlug(slug) || null
  }
})

if (!article.value) {
  throw createError({ statusCode: 404, message: 'Article not found' })
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

const { data: relatedApiArticles } = await useAsyncData(`article-related-${slug}`, async () => {
  try {
    const params = new URLSearchParams({ per_page: '6' })
    if (articleCategoryKey.value) {
      params.set('category', articleCategoryKey.value)
    }

    const res = await $fetch<{ data: PublicArticle[] }>(`${baseURL}/articles?${params.toString()}`, {
      timeout: 2500,
    })

    return res?.data || []
  } catch {
    return []
  }
})

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
          <img
            v-if="article.featured_image"
            :src="article.featured_image"
            :alt="article.title"
            class="mb-8 aspect-[16/9] w-full rounded-[1.75rem] object-cover shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
          >
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

    <section class="ca-section pt-0">
      <div class="ca-container">
        <div class="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div class="ca-card p-5 sm:p-6">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ca-subtle)]">{{ t('blog.relatedTitle') }}</p>
                <h2 class="mt-2 font-display text-2xl font-bold text-[var(--ca-text)] sm:text-[2rem]">{{ t('blog.relatedTitle') }}</h2>
                <p class="mt-2 max-w-2xl text-sm text-[var(--ca-muted)]">{{ t('blog.relatedDescription') }}</p>
              </div>
            </div>

            <div v-if="relatedArticles.length" class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <NuxtLink
                v-for="item in relatedArticles"
                :key="item.slug"
                :to="`/artikel/${item.slug}`"
                class="ca-card-soft group overflow-hidden transition hover:-translate-y-1 hover:border-[color:var(--ca-gold-border)] hover:shadow-lg"
              >
                <img
                  v-if="item.featured_image"
                  :src="item.featured_image"
                  :alt="item.title"
                  class="aspect-[16/9] w-full object-cover transition group-hover:scale-[1.02]"
                >
                <ArticleCoverPlaceholder
                  v-else
                  :title="item.title"
                  :category="categoryLabel(item.category)"
                />
                <div class="p-4 sm:p-5">
                  <div class="flex flex-wrap items-center gap-2 text-[0.72rem]">
                    <span class="rounded-full bg-[var(--ca-kicker-bg)] px-2 py-0.5 font-bold uppercase tracking-[0.12em] text-brand-primary">
                      {{ categoryLabel(item.category) }}
                    </span>
                    <span class="text-[var(--ca-subtle)]">{{ getReadTime(item) }} {{ t('blog.readTime') }}</span>
                  </div>
                  <h3 class="mt-3 font-display text-xl font-bold leading-snug text-[var(--ca-text)]">{{ item.title }}</h3>
                  <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)] line-clamp-3">{{ item.description }}</p>
                  <div class="mt-4 flex items-center justify-between text-xs text-[var(--ca-subtle)]">
                    <span>{{ formatDate(item.published_at || item.created_at) }}</span>
                    <span class="inline-flex items-center gap-1 font-semibold ca-tone-gold">
                      {{ t('blog.readMore') }}
                      <Icon name="lucide:arrow-right" class="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </NuxtLink>
            </div>

            <div v-else class="mt-6 rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4 text-sm text-[var(--ca-muted)]">
              {{ t('blog.noRelatedArticles') }}
            </div>
          </div>

          <div class="ca-card p-5 sm:p-6">
            <p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ca-subtle)]">{{ t('home.products.kicker') }}</p>
            <h2 class="mt-2 font-display text-2xl font-bold text-[var(--ca-text)] sm:text-[2rem]">{{ t('blog.productsTitle') }}</h2>
            <p class="mt-2 text-sm text-[var(--ca-muted)]">{{ t('blog.productsDescription') }}</p>

            <div class="mt-6 space-y-3">
              <NuxtLink
                v-for="product in productSpotlights"
                :key="product.to"
                :to="product.to"
                class="ca-card-soft group block p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)]"
              >
                <div class="flex items-start gap-3">
                  <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
                    <Icon :name="product.icon" class="h-4 w-4 ca-tone-gold" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">{{ product.tagline }}</p>
                    <h3 class="mt-1 font-display text-lg font-bold text-[var(--ca-text)]">{{ product.name }}</h3>
                    <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ product.description }}</p>
                  </div>
                  <Icon name="lucide:arrow-right" class="mt-1 h-4 w-4 flex-shrink-0 text-[var(--ca-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ca-gold-text)]" />
                </div>
              </NuxtLink>
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
