<script setup lang="ts">
import { LINKS } from '~/utils/constants'
import { getArticleBySlug, ARTICLES } from '~/utils/articles'

const { t } = useCoreI18n()
const route = useRoute()
const slug = route.params.slug as string
const config = useRuntimeConfig()
const baseURL = import.meta.client
  ? (config.public?.gatewayPublicUrl || 'http://localhost:8084/api')
  : (config.public?.gatewayUrl || 'http://localhost:8081/api')

// Fetch from API with static fallback
const { data: article } = await useAsyncData(`article-${slug}`, async () => {
  try {
    const res = await $fetch<{ data: any }>(`${baseURL}/articles/${slug}`)
    return res?.data || null
  } catch {
    return getArticleBySlug(slug) || null
  }
})

if (!article.value) {
  throw createError({ statusCode: 404, message: 'Article not found' })
}

useCoreSeo({
  title: article.value.title,
  description: article.value.description,
  path: `/artikel/${slug}`,
  ogType: 'article',
})

useSchemaOrg([
  defineWebPage({ name: article.value.title, description: article.value.description }),
])

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.value.title,
      description: article.value.description,
      datePublished: article.value.published_at || article.value.publishedAt,
      author: { '@type': 'Organization', name: 'CoreAsia Teknologi', url: 'https://coreasia.id' },
      publisher: { '@type': 'Organization', name: 'CoreAsia Teknologi', logo: { '@type': 'ImageObject', url: 'https://coreasia.id/logos/logo-512.webp' } },
      mainEntityOfPage: `https://coreasia.id/artikel/${slug}`,
    }),
  }],
})

const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
const categoryLabel = (key: string) => { const cats = t('blog.categories') as Record<string, string>; return cats[key] || key }
const getPublishDate = (a: any) => a.published_at || a.publishedAt || a.created_at
const getReadTime = (a: any) => a.read_time || a.readTime || 5
const getTags = (a: any) => a.tags || []

const renderedContent = computed(() => {
  if (!article.value) return ''
  return article.value.content
    .replace(/^### (.+)$/gm, '<h3 class="mt-6 mb-2 text-lg font-display font-bold text-[var(--ca-text)]">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-8 mb-3 text-xl font-display font-bold text-[var(--ca-text)]">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[var(--ca-text)]">$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="font-semibold ca-link-accent">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 flex items-start gap-2 text-sm text-[var(--ca-muted)]"><span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--ca-subtle)]"></span><span>$1</span></li>')
    .replace(/\n\n/g, '</p><p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">')
})
</script>

<template>
  <div v-if="article">
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-[radial-gradient(920px_420px_at_50%_0%,rgba(251,191,36,0.12),transparent_62%)]" />
      </div>
      <div class="ca-container relative ca-section pt-6 sm:pt-8 pb-10 sm:pb-12 lg:pb-16">
        <div class="mx-auto max-w-3xl">
          <NuxtLink to="/artikel" class="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ca-muted)] hover:text-[var(--ca-text)]">
            <Icon name="lucide:arrow-left" class="h-4 w-4" /> {{ t('blog.kicker') }}
          </NuxtLink>
          <div class="mt-5 flex items-center gap-3">
            <span class="rounded-md bg-[var(--ca-kicker-bg)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-primary">{{ categoryLabel(article.category) }}</span>
            <span class="text-xs text-[var(--ca-subtle)]">{{ getReadTime(article) }} {{ t('blog.readTime') }}</span>
            <span class="text-xs text-[var(--ca-subtle)]">{{ formatDate(getPublishDate(article)) }}</span>
          </div>
          <h1 class="mt-4 text-balance font-display text-3xl font-bold leading-[1.12] text-[var(--ca-text)] sm:text-4xl">{{ article.title }}</h1>
          <p class="ca-copy mt-4 max-w-2xl">{{ article.description }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span v-for="tag in getTags(article)" :key="tag" class="ca-chip">{{ tag }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="ca-section pt-0">
      <div class="ca-container">
        <article class="mx-auto max-w-3xl">
          <img v-if="article.featured_image" :src="article.featured_image" :alt="article.title" class="mb-8 w-full rounded-2xl object-cover" />
          <div v-html="'<p class=&quot;text-sm leading-relaxed text-[var(--ca-muted)]&quot;>' + renderedContent + '</p>'" />
        </article>
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
