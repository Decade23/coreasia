<script setup lang="ts">
import { CONTACT, COMPANY } from '~/utils/constants'

const { t } = useCoreI18n()

const { useReveal } = useScrollReveal()
const heroSection = useReveal('fadeUp')
const contentCard = useReveal('fadeUp', 100)

useCoreSeo({
    title: t('legal.terms.title') as string,
    description: t('legal.terms.description') as string,
    path: '/terms',
})

const sections = computed(() => {
    const raw = t('legal.terms.sections') as Record<string, any>
    return Object.values(raw).map(section => ({
        ...section,
        content: section.content
            ?.replace(/{company}/g, COMPANY.name)
            ?.replace(/{email}/g, CONTACT.email)
    }))
})
</script>

<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(800px_300px_at_50%_0%,rgba(251,191,36,0.08),transparent_62%)]"
                />
            </div>

            <div ref="heroSection" class="ca-container relative ca-section pt-6 sm:pt-8 pb-8">
                <span class="ca-kicker">{{ t('legal.kicker') }}</span>
                <h1
                    class="mt-5 font-display text-4xl font-bold text-[var(--ca-text)] sm:text-5xl"
                >
                    {{ t('legal.terms.title') }}
                </h1>
                <p class="ca-copy mt-4">
                    {{ t('legal.terms.lastUpdated') }}
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
                </article>
            </div>
        </section>
    </div>
</template>
