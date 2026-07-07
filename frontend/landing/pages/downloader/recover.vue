<script setup lang="ts">
import { CONTACT, COMPANY } from '~/utils/constants'

const { t } = useCoreI18n()

// Resolusi token konten (sumber-tunggal nama perusahaan & email support).
const sub = (s?: string) => s
    ?.replace(/{company}/g, COMPANY.legalName)
    ?.replace(/{email}/g, CONTACT.email)

const { useReveal } = useScrollReveal()
const heroSection = useReveal('fadeUp')
const contentCard = useReveal('fadeUp', 100)

useCoreSeo({
    title: t('legal.downloaderRecover.title') as string,
    description: sub(t('legal.downloaderRecover.description') as string) as string,
    path: '/downloader/recover',
})

const sections = computed(() => {
    const raw = t('legal.downloaderRecover.sections') as Record<string, any>
    return Object.values(raw).map(section => ({
        ...section,
        content: sub(section.content),
        items: section.items?.map((i: string) => sub(i)),
    }))
})

const mailtoHref = computed(() => {
    const subject = encodeURIComponent(t('legal.downloaderRecover.ctaSubject') as string)
    return `mailto:${CONTACT.email}?subject=${subject}`
})
</script>

<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(800px_300px_at_50%_0%,rgba(45,212,191,0.08),transparent_62%)]"
                />
            </div>

            <div ref="heroSection" class="ca-container relative ca-section pt-6 sm:pt-8 pb-8">
                <span class="ca-kicker">CoreAsia Download Manager</span>
                <h1
                    class="mt-5 font-display text-4xl font-bold text-[var(--ca-text)] sm:text-5xl"
                >
                    {{ t('legal.downloaderRecover.title') }}
                </h1>
                <p class="ca-copy mt-4">
                    {{ t('legal.downloaderRecover.subtitle') }}
                </p>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <article
                    ref="contentCard"
                    class="ca-card ca-prose max-w-none p-6 sm:p-8 lg:p-10"
                >
                    <div v-for="(section, index) in sections" :key="index">
                        <h2 v-if="section.title">{{ section.title }}</h2>
                        <p v-if="section.content">{{ section.content }}</p>
                        <ul v-if="section.items">
                            <li v-for="item in section.items" :key="item">
                                {{ item }}
                            </li>
                        </ul>
                    </div>

                    <a
                        :href="mailtoHref"
                        class="ca-btn-primary mt-6 no-underline"
                    >
                        {{ t('legal.downloaderRecover.cta') }}
                    </a>
                </article>
            </div>
        </section>
    </div>
</template>
