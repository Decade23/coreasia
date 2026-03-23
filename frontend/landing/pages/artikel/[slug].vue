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

const featuredRelatedArticle = computed(() => relatedArticles.value[0] || null)
const secondaryRelatedArticles = computed(() => relatedArticles.value.slice(1, 3))

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
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.24fr)_minmax(320px,0.92fr)]">
          <div class="ca-card relative overflow-hidden p-5 sm:p-6 lg:p-7">
            <div class="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(560px_220px_at_0%_0%,rgba(245,158,11,0.14),transparent_72%)]" />
            <div class="relative">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ca-subtle)]">{{ t('blog.relatedTitle') }}</p>
                  <h2 class="mt-2 font-display text-2xl font-bold text-[var(--ca-text)] sm:text-[2rem]">{{ t('blog.relatedTitle') }}</h2>
                  <p class="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ca-muted)]">{{ t('blog.relatedDescription') }}</p>
                </div>
              </div>

              <div v-if="featuredRelatedArticle" class="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(260px,0.92fr)]">
                <NuxtLink
                  :to="`/artikel/${featuredRelatedArticle.slug}`"
                  class="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[color:var(--ca-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ca-panel-bg)_96%,transparent),color-mix(in_srgb,var(--ca-panel-bg-strong)_94%,transparent))] transition duration-200 hover:-translate-y-1 hover:border-[color:var(--ca-gold-border)] hover:shadow-[0_28px_80px_rgba(15,23,42,0.18)]"
                >
                  <div class="relative overflow-hidden">
                    <img
                      v-if="featuredRelatedArticle.featured_image"
                      :src="featuredRelatedArticle.featured_image"
                      :alt="featuredRelatedArticle.title"
                      class="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    >
                    <ArticleCoverPlaceholder
                      v-else
                      :title="featuredRelatedArticle.title"
                      :category="categoryLabel(featuredRelatedArticle.category)"
                      class="aspect-[16/10] w-full"
                    />
                    <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(4,7,14,0.82)] via-[rgba(4,7,14,0.34)] to-transparent" />
                    <div class="absolute left-4 top-4 flex flex-wrap items-center gap-2 text-[0.72rem]">
                      <span class="rounded-full bg-[rgba(8,12,22,0.78)] px-2.5 py-1 font-bold uppercase tracking-[0.12em] text-[var(--ca-gold-text)] backdrop-blur-sm">
                        {{ categoryLabel(featuredRelatedArticle.category) }}
                      </span>
                      <span class="rounded-full bg-[rgba(8,12,22,0.62)] px-2.5 py-1 font-semibold text-white/80 backdrop-blur-sm">
                        {{ getReadTime(featuredRelatedArticle) }} {{ t('blog.readTime') }}
                      </span>
                    </div>
                  </div>

                  <div class="flex flex-1 flex-col p-5 sm:p-6">
                    <p class="text-xs font-medium text-[var(--ca-subtle)]">{{ formatDate(getPublishDate(featuredRelatedArticle)) }}</p>
                    <h3 class="mt-3 text-balance font-display text-2xl font-bold leading-tight text-[var(--ca-text)]">{{ featuredRelatedArticle.title }}</h3>
                    <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)] line-clamp-3">{{ featuredRelatedArticle.description }}</p>

                    <div v-if="getTags(featuredRelatedArticle).length" class="mt-4 flex flex-wrap gap-2">
                      <span
                        v-for="tag in getTags(featuredRelatedArticle).slice(0, 3)"
                        :key="tag"
                        class="rounded-full border border-[color:var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-panel-bg)_78%,transparent)] px-2.5 py-1 text-[0.72rem] font-medium text-[var(--ca-muted)]"
                      >
                        {{ tag }}
                      </span>
                    </div>

                    <div class="mt-auto pt-5 inline-flex items-center gap-2 text-sm font-semibold ca-tone-gold">
                      {{ t('blog.readMore') }}
                      <Icon name="lucide:arrow-up-right" class="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </NuxtLink>

                <div v-if="secondaryRelatedArticles.length" class="grid gap-4">
                  <NuxtLink
                    v-for="item in secondaryRelatedArticles"
                    :key="item.slug"
                    :to="`/artikel/${item.slug}`"
                    class="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[color:var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-panel-bg)_82%,transparent)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)] hover:shadow-[0_22px_60px_rgba(15,23,42,0.14)] sm:flex-row sm:items-stretch sm:gap-4"
                  >
                    <div class="relative overflow-hidden rounded-[1.1rem] sm:w-32 sm:flex-shrink-0">
                      <img
                        v-if="item.featured_image"
                        :src="item.featured_image"
                        :alt="item.title"
                        class="aspect-[4/3] h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      >
                      <ArticleCoverPlaceholder
                        v-else
                        :title="item.title"
                        :category="categoryLabel(item.category)"
                        class="aspect-[4/3] h-full w-full"
                      />
                    </div>

                    <div class="min-w-0 flex flex-1 flex-col pt-4 sm:pt-0">
                      <div class="flex flex-wrap items-center gap-2 text-[0.72rem]">
                        <span class="rounded-full bg-[var(--ca-kicker-bg)] px-2 py-0.5 font-bold uppercase tracking-[0.12em] text-brand-primary">
                          {{ categoryLabel(item.category) }}
                        </span>
                        <span class="text-[var(--ca-subtle)]">{{ formatDate(getPublishDate(item)) }}</span>
                      </div>
                      <h3 class="mt-3 text-balance font-display text-lg font-bold leading-snug text-[var(--ca-text)] line-clamp-2">{{ item.title }}</h3>
                      <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)] line-clamp-2">{{ item.description }}</p>
                      <div class="mt-auto pt-4 inline-flex items-center gap-2 text-sm font-semibold ca-tone-gold">
                        {{ t('blog.readMore') }}
                        <Icon name="lucide:arrow-right" class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </NuxtLink>
                </div>
              </div>

              <div v-else class="mt-6 rounded-[1.35rem] border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-5 text-sm leading-relaxed text-[var(--ca-muted)]">
                {{ t('blog.noRelatedArticles') }}
              </div>
            </div>
          </div>

          <div class="ca-card relative overflow-hidden p-5 sm:p-6 lg:p-7">
            <div class="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.16),transparent_70%)] blur-3xl" />
            <div class="relative">
              <p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ca-subtle)]">{{ t('home.products.kicker') }}</p>
              <h2 class="mt-2 font-display text-2xl font-bold text-[var(--ca-text)] sm:text-[2rem]">{{ t('blog.productsTitle') }}</h2>
              <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ t('blog.productsDescription') }}</p>

              <div class="mt-6 space-y-4">
                <NuxtLink
                  v-for="product in productSpotlights"
                  :key="product.to"
                  :to="product.to"
                  class="group relative block overflow-hidden rounded-[1.5rem] border border-[color:var(--ca-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ca-panel-bg)_94%,transparent),color-mix(in_srgb,var(--ca-panel-bg-strong)_90%,transparent))] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)] hover:shadow-[0_22px_60px_rgba(15,23,42,0.14)]"
                >
                  <div class="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--ca-gold-border)_76%,transparent),transparent)]" />
                  <div class="flex items-start gap-4">
                    <span class="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-[color:var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-panel-bg-strong)_84%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <Icon :name="product.icon" class="h-4 w-4 ca-tone-gold" />
                    </span>

                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <span v-if="product.badge" class="rounded-full border border-[color:var(--ca-gold-border)]/50 bg-[rgba(245,158,11,0.08)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-gold-text)]">
                          {{ product.badge }}
                        </span>
                        <span class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">{{ product.tagline }}</span>
                      </div>
                      <h3 class="mt-3 text-balance font-display text-xl font-bold leading-tight text-[var(--ca-text)]">{{ product.name }}</h3>
                      <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ product.description }}</p>

                      <div v-if="product.features.length" class="mt-4 flex flex-wrap gap-2">
                        <span
                          v-for="feature in product.features"
                          :key="feature"
                          class="rounded-full border border-[color:var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-panel-bg)_80%,transparent)] px-2.5 py-1 text-[0.72rem] font-medium leading-relaxed text-[var(--ca-muted)]"
                        >
                          {{ feature }}
                        </span>
                      </div>

                      <div class="mt-5 inline-flex items-center gap-2 text-sm font-semibold ca-tone-gold">
                        {{ product.ctaLabel }}
                        <Icon name="lucide:arrow-up-right" class="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </NuxtLink>
              </div>

              <div v-if="productRoadmap.length" class="mt-5 rounded-[1.35rem] border border-[color:var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-panel-bg)_78%,transparent)] p-4 sm:p-5">
                <p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ca-subtle)]">{{ t('blog.productsRoadmapTitle') }}</p>
                <div class="mt-3 space-y-3">
                  <div
                    v-for="product in productRoadmap"
                    :key="product.name"
                    class="rounded-[1.1rem] border border-[color:var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-panel-bg-strong)_76%,transparent)] p-3.5"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">{{ product.tagline }}</span>
                          <span v-if="product.badge" class="rounded-full border border-[color:var(--ca-border)] px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-subtle)]">
                            {{ product.badge }}
                          </span>
                        </div>
                        <h3 class="mt-2 font-display text-base font-bold text-[var(--ca-text)]">{{ product.name }}</h3>
                        <p class="mt-1.5 text-sm leading-relaxed text-[var(--ca-muted)]">{{ product.description }}</p>
                      </div>
                      <Icon name="lucide:sparkles" class="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--ca-gold-text)]" />
                    </div>
                  </div>
                </div>
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
