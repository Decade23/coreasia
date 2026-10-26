<script setup lang="ts">
import { BRAND_ASSETS, COMPANY, LINKS } from '~/utils/constants'
import type { PublicArticle } from '~/utils/public-articles'
import { articleCategory } from '~/utils/public-articles'
import { resolveArticleCover } from '~/utils/article-assets'
import { stringifyJsonLd } from '~/utils/public-seo'
definePageMeta({ middleware: 'article-language' })

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

const { t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()
const route = useRoute()
const router = useRouter()
const slug = route.params.slug as string
const siteOrigin = useSiteOrigin()
const articleHero = useReveal('fadeUp')
const articleContent = useReveal('fadeUp', 80)
const relatedHeader = useReveal('fadeUp')
const productsHeader = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')
const { data: articleResponse, error: articleError } = await useFetch<{ data: PublicArticle }>(`/api/public/articles/${encodeURIComponent(slug)}`, { key: `public-article-${slug}` })
if (articleError.value || !articleResponse.value?.data) throw createError({ statusCode: 404, message: 'Artikel tidak ditemukan' })
const article = computed(() => articleResponse.value!.data)
const cover = computed(() => resolveArticleCover(article.value))
useCoreSeo(() => ({ title: article.value.title, description: article.value.description, path: `/artikel/${slug}`, ogType: 'article', image: cover.value.src, imageAlt: cover.value.alt, ogImageWidth: cover.value.width, ogImageHeight: cover.value.height }))
useHead(() => ({ script: [{ type: 'application/ld+json', innerHTML: stringifyJsonLd({
  '@context': 'https://schema.org', '@type': 'Article', '@id': `${siteOrigin.value}/artikel/${slug}#article`,
  headline: article.value.title, description: article.value.description,
  datePublished: article.value.published_at, dateModified: article.value.updated_at,
  image: [new URL(cover.value.src, siteOrigin.value).href],
  author: { '@type': 'Organization', name: article.value.author, url: siteOrigin.value },
  publisher: { '@type': 'Organization', name: COMPANY.name, url: siteOrigin.value, logo: { '@type': 'ImageObject', url: `${siteOrigin.value}${BRAND_ASSETS.logo}` } },
  mainEntityOfPage: `${siteOrigin.value}/artikel/${slug}`, inLanguage: 'id-ID',
}) }] }))
useSeoMeta({ articlePublishedTime: () => article.value.published_at, articleModifiedTime: () => article.value.updated_at })
const { data: catalogResponse } = await useFetch<{ data: PublicArticle[] }>('/api/public/articles', { key: 'public-article-catalog', default: () => ({ data: [] }) })
const relatedArticles = computed(() => [...(catalogResponse.value?.data || [])].filter(item => item.slug !== slug).sort((a, b) => Number(articleCategory(a.category) !== articleCategory(article.value.category)) - Number(articleCategory(b.category) !== articleCategory(article.value.category)) || Date.parse(b.published_at) - Date.parse(a.published_at)).slice(0, 3))
const formatDate = (value: string) => new Date(value).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' })
const categoryLabel = (key: string) => (t('blog.categories') as Record<string, string>)[articleCategory(key)] || key
const getPublishDate = (item: PublicArticle) => item.published_at
const getReadTime = (item: PublicArticle) => item.read_time
const getTags = (item: PublicArticle) => item.tags

const productSpotlights = computed<ProductSpotlight[]>(() => {
    const products = ((t('home.products.items') as Array<{ name: string; tagline: string; description: string; heroDesc?: string; to: string; badge?: string; ctaLabel?: string; features?: string[] }>) || []).slice(0, 3)

    return products.map((product, index) => ({
        name: product.name,
        tagline: product.tagline,
        description: product.heroDesc || product.description,
        to: product.to,
        icon: index === 0 ? 'lucide:activity' : index === 1 ? 'lucide:code-2' : 'lucide:boxes',
        badge: product.badge || '',
        ctaLabel: product.ctaLabel || (t('blog.readMore') as string),
        features: (product.features || []).slice(0, 3),
    }))
})

const productRoadmap = computed<ProductRoadmapItem[]>(() => {
    const nextProducts = ((t('home.products.comingSoon') as Array<{ name: string; tagline: string; description: string; heroDesc?: string; to: string; badge?: string; ctaLabel?: string; features?: string[] }>) || []).slice(0, 2)

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
                <div
                    class="absolute inset-0 bg-[radial-gradient(920px_420px_at_50%_0%,rgba(251,191,36,0.12),transparent_62%)]"
                />
            </div>
            <div ref="articleHero" class="ca-container relative ca-section pt-6 sm:pt-8 pb-10 sm:pb-12 lg:pb-16">
                <div class="mx-auto max-w-3xl">
                    <button
                        type="button"
                        class="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ca-muted)] transition hover:text-[var(--ca-text)]"
                        @click="goToArticles"
                    >
                        <Icon name="lucide:arrow-left" class="h-4 w-4" />
                        {{ t('blog.kicker') }}
                    </button>
                    <div class="mt-5 flex flex-wrap items-center gap-3">
                        <span
                            class="rounded-md bg-[var(--ca-kicker-bg)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-primary"
                        >
                            {{ categoryLabel(article.category) }}
                        </span>
                        <span class="text-xs text-[var(--ca-subtle)]">
                            {{ getReadTime(article) }} {{ t('blog.readTime') }}
                        </span>
                        <span class="text-xs text-[var(--ca-subtle)]">{{ formatDate(getPublishDate(article)) }}</span>
                    </div>
                    <h1
                        class="mt-4 text-balance font-display text-3xl font-bold leading-[1.12] text-[var(--ca-text)] sm:text-4xl lg:text-[3rem]"
                    >
                        {{ article.title }}
                    </h1>
                    <p class="ca-copy mt-4 max-w-2xl">{{ article.description }}</p>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <span v-for="tag in getTags(article)" :key="tag" class="ca-chip">{{ tag }}</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <article ref="articleContent" class="mx-auto max-w-4xl">
                    <figure class="mb-8"><ArticleCover :slug="article.slug" :title="article.title" :image="article.featured_image" priority class="rounded-[1.75rem]" /><figcaption v-if="cover.generated" class="mt-2 text-xs text-[var(--ca-subtle)]">Ilustrasi untuk artikel, bukan tangkapan layar produk.</figcaption></figure>
                    <p class="mb-5 text-sm text-[var(--ca-muted)]">Oleh {{ article.author }}<span v-if="article.updated_at !== article.published_at"> · Diperbarui {{ formatDate(article.updated_at) }}</span></p>
                    <ArticleContentRenderer :content="article.content" />
                </article>
            </div>
        </section>

        <!-- Related Articles -->
        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="mx-auto max-w-4xl">
                    <div ref="relatedHeader" class="mb-8 flex items-center gap-3">
                        <div class="h-px flex-1 bg-[var(--ca-border)]" />
                        <span class="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--ca-subtle)]">
                            {{ t('blog.relatedTitle') }}
                        </span>
                        <div class="h-px flex-1 bg-[var(--ca-border)]" />
                    </div>

                    <div v-if="relatedArticles.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <NuxtLink
                            v-for="(item, index) in relatedArticles"
                            :key="item.slug"
                            :ref="revealRef('fadeUp', index * 90)"
                            :to="`/artikel/${item.slug}`"
                            class="group flex flex-col overflow-hidden rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)] hover:shadow-[var(--ca-card-soft-shadow)]"
                        >
                            <div class="relative overflow-hidden">
                                <ArticleCover :slug="item.slug" :title="item.title" :image="item.featured_image" class="transition group-hover:scale-[1.02]" />
                                <span
                                    class="absolute left-3 top-3 rounded-md bg-[rgba(8,12,22,0.82)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[var(--ca-gold-text)] backdrop-blur-sm"
                                >
                                    {{ categoryLabel(item.category) }}
                                </span>
                            </div>

                            <div class="flex flex-1 flex-col p-4">
                                <div class="flex items-center gap-2 text-[0.7rem] text-[var(--ca-subtle)]">
                                    <span>{{ formatDate(getPublishDate(item)) }}</span>
                                    <span class="inline-block h-0.5 w-0.5 rounded-full bg-[var(--ca-subtle)]" />
                                    <span>{{ getReadTime(item) }} {{ t('blog.readTime') }}</span>
                                </div>
                                <h3
                                    class="mt-2.5 text-balance font-display text-[0.95rem] font-bold leading-snug text-[var(--ca-text)] line-clamp-2 group-hover:text-[var(--ca-gold-text)] transition-colors duration-200"
                                >
                                    {{ item.title }}
                                </h3>
                                <p class="mt-1.5 text-[0.8rem] leading-relaxed text-[var(--ca-muted)] line-clamp-2">
                                    {{ item.description }}
                                </p>

                                <div
                                    class="mt-auto pt-4 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold ca-tone-gold"
                                >
                                    {{ t('blog.readMore') }}
                                    <Icon
                                        name="lucide:arrow-right"
                                        class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                                    />
                                </div>
                            </div>
                        </NuxtLink>
                    </div>

                    <div
                        v-else
                        class="rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-5 text-center text-sm text-[var(--ca-muted)]"
                    >
                        {{ t('blog.noRelatedArticles') }}
                    </div>
                </div>
            </div>
        </section>

        <!-- Products -->
        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="mx-auto max-w-4xl">
                    <div ref="productsHeader" class="mb-8 flex items-center gap-3">
                        <div class="h-px flex-1 bg-[var(--ca-border)]" />
                        <span class="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[var(--ca-subtle)]">
                            {{ t('home.products.kicker') }}
                        </span>
                        <div class="h-px flex-1 bg-[var(--ca-border)]" />
                    </div>

                    <div class="text-center mb-8">
                        <h2 class="font-display text-2xl font-bold text-[var(--ca-text)] sm:text-3xl">
                            {{ t('blog.productsTitle') }}
                        </h2>
                        <p class="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[var(--ca-muted)]">
                            {{ t('blog.productsDescription') }}
                        </p>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <NuxtLink
                            v-for="(product, index) in productSpotlights"
                            :key="product.to"
                            :ref="revealRef('fadeUp', index * 90)"
                            :to="product.to"
                            class="group relative flex flex-col overflow-hidden rounded-2xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--ca-gold-border)] hover:shadow-[var(--ca-card-soft-shadow)]"
                        >
                            <div
                                class="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--ca-gold-border)_60%,transparent),transparent)]"
                            />

                            <div class="flex items-center gap-3">
                                <span
                                    class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]"
                                >
                                    <Icon :name="product.icon" class="h-4 w-4 ca-tone-gold" />
                                </span>
                                <div class="min-w-0">
                                    <h3 class="font-display text-base font-bold leading-tight text-[var(--ca-text)]">
                                        {{ product.name }}
                                    </h3>
                                    <span
                                        v-if="product.badge"
                                        class="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--ca-gold-text)]"
                                    >
                                        {{ product.badge }}
                                    </span>
                                </div>
                            </div>

                            <p class="mt-3 text-[0.8rem] leading-relaxed text-[var(--ca-muted)] line-clamp-2">
                                {{ product.description }}
                            </p>

                            <div v-if="product.features.length" class="mt-3 flex flex-wrap gap-1.5">
                                <span
                                    v-for="feature in product.features"
                                    :key="feature"
                                    class="rounded-md border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--ca-muted)]"
                                >
                                    {{ feature }}
                                </span>
                            </div>

                            <div
                                class="mt-auto pt-4 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold ca-tone-gold"
                            >
                                {{ product.ctaLabel }}
                                <Icon
                                    name="lucide:arrow-up-right"
                                    class="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                />
                            </div>
                        </NuxtLink>
                    </div>

                    <div v-if="productRoadmap.length" class="mt-5 grid gap-3 sm:grid-cols-2">
                        <div
                            v-for="(product, index) in productRoadmap"
                            :key="product.name"
                            :ref="revealRef('fadeUp', index * 90)"
                            class="flex items-start gap-3 rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4"
                        >
                            <Icon
                                name="lucide:sparkles"
                                class="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--ca-gold-text)]"
                            />
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    <h3 class="font-display text-sm font-bold text-[var(--ca-text)]">
                                        {{ product.name }}
                                    </h3>
                                    <span
                                        v-if="product.badge"
                                        class="rounded-md border border-[color:var(--ca-border)] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[var(--ca-subtle)]"
                                    >
                                        {{ product.badge }}
                                    </span>
                                </div>
                                <p class="mt-1 text-[0.78rem] leading-relaxed text-[var(--ca-muted)]">
                                    {{ product.description }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div ref="ctaSection" class="ca-card p-6 text-center sm:p-10">
                    <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
                        {{ t('blog.cta.title') }}
                    </h2>
                    <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
                        {{ t('blog.cta.subtitle') }}
                    </p>
                    <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <NuxtLink to="/contact" class="ca-btn-primary">
                            {{ t('blog.cta.button') }}
                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                        </NuxtLink>
                        <a :href="LINKS.whatsapp" target="_blank" rel="noopener noreferrer" class="ca-btn-secondary">
                            <Icon name="lucide:message-circle" class="h-4 w-4" />
                            WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
