<script setup lang="ts">
import { ARTICLES } from '~/utils/articles'

const { t } = useCoreI18n()
const config = useRuntimeConfig()
const baseURL = config.public?.gatewayUrl || 'http://localhost:8081/api'

useCoreSeo({
  title: t('blog.title') as string,
  description: t('blog.description') as string,
  path: '/artikel',
})

useSchemaOrg([
  defineWebPage({
    name: t('blog.title') as string,
    description: t('blog.description') as string,
  }),
])

const activeCategory = ref('all')
const categories = computed(() => {
  const cats = t('blog.categories') as Record<string, string>
  return Object.entries(cats).map(([key, label]) => ({ key, label }))
})

// Fetch from API with static fallback
const { data: apiArticles } = await useAsyncData('published-articles', async () => {
  try {
    const res = await $fetch<{ data: any[] }>(`${baseURL}/articles`, {
      params: { per_page: 50 },
    })
    return res?.data || []
  } catch {
    return null
  }
})

const articles = computed(() => {
  if (apiArticles.value && apiArticles.value.length > 0) return apiArticles.value
  return ARTICLES
})

const filteredArticles = computed(() => {
  if (activeCategory.value === 'all') return articles.value
  return articles.value.filter((a: any) => a.category === activeCategory.value)
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
}

const categoryLabel = (key: string) => {
  const cats = t('blog.categories') as Record<string, string>
  return cats[key] || key
}

const getPublishDate = (a: any) => a.published_at || a.publishedAt || a.created_at
const getReadTime = (a: any) => a.read_time || a.readTime || 5
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
        <div class="mb-8 flex flex-wrap gap-2">
          <button v-for="cat in categories" :key="cat.key" type="button"
            class="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
            :class="activeCategory === cat.key ? 'bg-[var(--ca-kicker-bg)] text-brand-primary' : 'text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)]'"
            @click="activeCategory = cat.key"
          >{{ cat.label }}</button>
        </div>

        <div v-if="filteredArticles.length" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <NuxtLink v-for="article in filteredArticles" :key="article.slug" :to="`/artikel/${article.slug}`"
            class="ca-card-soft group flex flex-col p-5 transition hover:-translate-y-1 hover:border-[color:var(--ca-gold-border)] hover:shadow-lg"
          >
            <img v-if="article.featured_image" :src="article.featured_image" :alt="article.title" class="mb-4 h-40 w-full rounded-lg object-cover" />
            <div class="flex items-center gap-2">
              <span class="rounded-md bg-[var(--ca-kicker-bg)] px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-primary">
                {{ categoryLabel(article.category) }}
              </span>
              <span class="text-xs text-[var(--ca-subtle)]">{{ getReadTime(article) }} {{ t('blog.readTime') }}</span>
            </div>
            <h2 class="mt-3 text-lg font-display font-bold leading-snug text-[var(--ca-text)]">{{ article.title }}</h2>
            <p class="mt-2 flex-1 text-sm leading-relaxed text-[var(--ca-muted)] line-clamp-3">{{ article.description }}</p>
            <div class="mt-4 flex items-center justify-between">
              <span class="text-xs text-[var(--ca-subtle)]">{{ formatDate(getPublishDate(article)) }}</span>
              <span class="inline-flex items-center gap-1 text-sm font-semibold ca-tone-gold">
                {{ t('blog.readMore') }}
                <Icon name="lucide:arrow-right" class="h-3.5 w-3.5" />
              </span>
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
