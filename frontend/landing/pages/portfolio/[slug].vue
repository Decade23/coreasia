<script setup lang="ts">
import { CASE_STUDIES } from '~/utils/case-studies'
import { stringifyJsonLd } from '~/utils/public-seo'
const route = useRoute()
const origin = useSiteOrigin()
const item = CASE_STUDIES.find((item) => item.slug === route.params.slug)
if (!item) throw createError({ statusCode: 404, statusMessage: 'Studi kasus tidak ditemukan' })
definePageMeta({ middleware: 'article-language' })
useCoreSeo({
    title: item.product === 'LeadKu' ? 'Studi Kasus LeadKu: CRM Tim Penjualan' : 'Studi Kasus Pantau: Dashboard Monitoring Website',
    description: item.summary,
    path: `/portfolio/${item.slug}`,
    image: item.product === 'LeadKu' ? '/social/og-leadku.png' : '/articles/web-monitoring-1200.webp',
    ogImageWidth: 1200,
    ogImageHeight: 630,
})
useHead({
    htmlAttrs: { lang: 'id-ID' },
    script: [
        {
            type: 'application/ld+json',
            innerHTML: stringifyJsonLd({
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                name: item.title,
                description: item.summary,
                url: `${origin.value}/portfolio/${item.slug}`,
                inLanguage: 'id-ID',
                about: { '@type': 'SoftwareApplication', name: item.product, url: `${origin.value}${item.to}` },
            }),
        },
    ],
})
</script>
<template>
    <div>
        <section class="ca-section">
            <div class="ca-container max-w-4xl">
                <NuxtLink to="/portfolio" class="text-sm ca-tone-gold">Portofolio CoreAsia</NuxtLink>
                <h1 class="ca-title mt-5">{{ item.title }}</h1>
                <p class="ca-copy mt-5">{{ item.summary }}</p>
                <div class="mt-6 flex items-center gap-3">
                    <img src="/logo.svg" alt="" width="36" height="36" >
                    <span class="text-sm font-semibold">Produk milik CoreAsia</span>
                </div>
            </div>
        </section>
        <section class="ca-section pt-0">
            <div class="ca-container max-w-4xl">
                <div class="ca-card p-7 sm:p-9">
                    <h2 class="font-display text-2xl font-bold">Konteks pengerjaan</h2>
                    <p class="ca-copy mt-4">{{ item.context }}</p>
                    <div v-for="[title, description] in item.decisions" :key="title" class="mt-8">
                        <h2 class="font-display text-xl font-bold">{{ title }}</h2>
                        <p class="mt-3 text-sm leading-relaxed text-[var(--ca-muted)]">{{ description }}</p>
                    </div>
                    <h2 class="mt-8 font-display text-xl font-bold">Bagian yang dibangun</h2>
                    <ul class="mt-4 space-y-3 text-sm">
                        <li v-for="feature in item.delivered" :key="feature" class="flex gap-2">
                            <Icon name="lucide:check" class="mt-0.5 h-4 w-4 text-emerald-600" />
                            {{ feature }}
                        </li>
                    </ul>
                </div>
                <p class="mt-5 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.boundary }}</p>
                <div class="mt-7 flex flex-wrap gap-3">
                    <NuxtLink :to="item.to" class="ca-btn-secondary">Pelajari {{ item.product }}</NuxtLink>
                    <NuxtLink to="/layanan/jasa-pembuatan-aplikasi-web" class="ca-btn-secondary">
                        Jasa aplikasi web custom
                    </NuxtLink>
                    <NuxtLink to="/contact" class="ca-btn-primary">Diskusikan kebutuhan tim</NuxtLink>
                </div>
            </div>
        </section>
    </div>
</template>
