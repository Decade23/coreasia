<script setup lang="ts">
import { LINKS } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { locale, t } = useCoreI18n()
const { useReveal } = useScrollReveal()

const ctaSection = useReveal('scaleUp')

useCoreSeo({
    title: t('home.title') as string,
    description: t('home.description') as string,
    path: '/',
})

useSchemaOrg([
    defineWebPage({
        name: 'Platform Teknologi',
    }),
    defineOrganization({
        name: 'CoreAsia Teknologi',
        url: 'https://coreasia.id',
        logo: 'https://coreasia.id/logos/logo-512.webp',
    }),
])
</script>

<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(1000px_460px_at_20%_0%,rgba(251,191,36,0.14),transparent_62%)]"
                />
                <div
                    class="absolute inset-0 bg-[radial-gradient(900px_440px_at_90%_15%,rgba(16,185,129,0.1),transparent_64%)]"
                />

                <ClientOnly>
                    <ThreeHeroScene />
                    <template #fallback>
                        <div class="absolute inset-0 z-0">
                            <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] bg-amber-500/10 blur-[100px] rounded-full mix-blend-screen"></div>
                            <div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-core-900/50 via-core-950 to-core-950" />
                        </div>
                    </template>
                </ClientOnly>
            </div>

            <div class="ca-container relative ca-section lg:py-28">
                <div class="mx-auto max-w-4xl text-center">
                    <span class="ca-kicker animate-fade-in-up min-h-[32px]">
                        <Icon
                            name="lucide:sparkles"
                            class="h-3.5 w-3.5 text-amber-300"
                        />
                        <TypewriterEffect :text="t('home.kicker')" />
                    </span>

                    <h1
                        class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.6rem] animate-fade-in-up delay-100"
                        v-html="t('home.hero.title')"
                    />

                    <p
                        class="ca-copy mx-auto mt-5 max-w-2xl animate-fade-in-up delay-200"
                        v-html="t('home.hero.subtitle')"
                    />

                    <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up delay-300">
                        <NuxtLink to="/contact" class="ca-btn-primary">
                            {{ t('home.hero.ctaPrimary') }}
                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                        </NuxtLink>
                        <a
                            :href="LINKS.whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary"
                        >
                            <Icon name="lucide:message-circle" class="h-4 w-4" />
                            {{ t('home.hero.ctaSecondary') }}
                        </a>
                    </div>

                    <p class="mt-4 text-xs font-medium text-slate-500 animate-fade-in delay-400">
                        <Icon name="lucide:shield-check" class="inline-block h-3 w-3 mr-1 text-emerald-500" />
                        {{ t('home.hero.powerStatement') }}
                    </p>

                    <div class="mt-8 flex flex-wrap items-center justify-center gap-2 animate-fade-in delay-500">
                        <span
                            v-for="chip in t('home.hero.chips')"
                            :key="chip"
                            class="ca-chip"
                        >
                            {{ chip }}
                        </span>
                    </div>
                </div>
            </div>
        </section>

        <LazySolutionsGrid />

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div
                    ref="ctaSection"
                    class="ca-card p-6 text-center sm:p-10"
                >
                    <h2 class="text-balance font-display text-3xl font-bold text-white sm:text-4xl">
                        {{ t('home.readyCTA.title') }}
                    </h2>
                    <p class="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                        {{ t('home.readyCTA.subtitle') }}
                    </p>
                    <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <NuxtLink
                            to="/contact"
                            class="ca-btn-primary"
                        >
                            {{ t('home.readyCTA.ctaPrimary') }}
                        </NuxtLink>
                        <a
                            :href="LINKS.whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary"
                        >
                            {{ t('home.readyCTA.ctaSecondary') }}
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <!-- <LazyTrustedBy /> -->
    </div>
</template>
