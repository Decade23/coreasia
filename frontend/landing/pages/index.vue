<script setup lang="ts">
import { LINKS } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { locale, t } = useCoreI18n()
const { useReveal } = useScrollReveal()

const heroKicker = useReveal('fadeUp', 0)
const heroTitle = useReveal('fadeUp', 100)
const heroCopy = useReveal('fadeUp', 200)
const heroActions = useReveal('fadeUp', 300)
const heroChips = useReveal('fadeUp', 400)
const heroScene = useReveal('fadeIn', 200)
const ctaSection = useReveal('scaleUp')

useCoreSeo({
    title: 'Infrastruktur Teknologi Pendidikan & Sertifikasi',
    description:
        'Mitra strategis untuk Lembaga Sertifikasi Profesi (LSP) dan Training Center. Platform SaaS LMS, venture partnership, dan solusi enterprise.',
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
                </ClientOnly>
            </div>

            <div class="ca-container relative ca-section lg:py-28">
                <div class="mx-auto max-w-4xl text-center">
                    <span
                        v-motion
                        :initial="{ opacity: 0, y: -20 }"
                        :enter="{ opacity: 1, y: 0, transition: { duration: 600, delay: 0 } }"
                        class="ca-kicker"
                    >
                        <Icon
                            name="lucide:sparkles"
                            class="h-3.5 w-3.5 text-amber-300"
                        />
                        <TypewriterEffect :text="t('home.kicker')" />
                    </span>

                    <h1
                        v-motion
                        :initial="{ opacity: 0, y: 30, scale: 0.95 }"
                        :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 800, delay: 100, type: 'spring', stiffness: 100 } }"
                        class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.6rem]"
                        v-html="t('home.hero.title')"
                    />

                    <p
                        v-motion
                        :initial="{ opacity: 0, y: 20 }"
                        :enter="{ opacity: 1, y: 0, transition: { duration: 700, delay: 200 } }"
                        class="ca-copy mx-auto mt-5 max-w-2xl"
                        v-html="t('home.hero.subtitle')"
                    />

                    <div
                        v-motion
                        :initial="{ opacity: 0, y: 20 }"
                        :enter="{ opacity: 1, y: 0, transition: { duration: 600, delay: 300 } }"
                        class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
                    >
                        <NuxtLink
                            to="/contact"
                            class="ca-btn-primary"
                            v-motion
                            :initial="{ opacity: 0, x: -20 }"
                            :enter="{ opacity: 1, x: 0, transition: { duration: 500, delay: 350 } }"
                        >
                            {{ t('home.hero.ctaPrimary') }}
                            <Icon
                                name="lucide:arrow-right"
                                class="h-4 w-4"
                            />
                        </NuxtLink>
                        <a
                            :href="LINKS.whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary"
                            v-motion
                            :initial="{ opacity: 0, x: 20 }"
                            :enter="{ opacity: 1, x: 0, transition: { duration: 500, delay: 350 } }"
                        >
                            <Icon
                                name="lucide:message-circle"
                                class="h-4 w-4"
                            />
                            {{ t('home.hero.ctaSecondary') }}
                        </a>
                    </div>

                    <!-- Power Statement -->
                    <p
                        v-motion
                        :initial="{ opacity: 0, scale: 0.8 }"
                        :enter="{ opacity: 1, scale: 1, transition: { duration: 500, delay: 400 } }"
                        class="mt-4 text-xs font-medium text-slate-500"
                    >
                        <Icon name="lucide:shield-check" class="inline-block h-3 w-3 mr-1 text-emerald-500" />
                        {{ t('home.hero.powerStatement') }}
                    </p>

                    <div
                        v-motion
                        :initial="{ opacity: 0 }"
                        :enter="{ opacity: 1, transition: { duration: 600, delay: 500 } }"
                        class="mt-8 flex flex-wrap items-center justify-center gap-2"
                    >
                        <span
                            v-for="(chip, index) in t('home.hero.chips')"
                            :key="chip"
                            v-motion
                            :initial="{ opacity: 0, scale: 0 }"
                            :enter="{ opacity: 1, scale: 1, transition: { duration: 400, delay: 600 + (index * 100) } }"
                            class="ca-chip"
                        >
                            {{ chip }}
                        </span>
                    </div>
                </div>
            </div>
        </section>



        <TrustedBy />
        <SolutionsGrid />

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div
                    v-motion
                    :initial="{ opacity: 0, scale: 0.95, y: 50 }"
                    :visible-once="{ opacity: 1, scale: 1, y: 0, transition: { duration: 800 } }"
                    class="ca-card p-6 text-center sm:p-10"
                >
                    <h2
                        class="text-balance font-display text-3xl font-bold text-white sm:text-4xl"
                    >
                        {{ t('home.readyCTA.title') }}
                    </h2>
                    <p
                        class="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base"
                    >
                        {{ t('home.readyCTA.subtitle') }}
                    </p>
                    <div
                        class="mt-6 flex flex-col justify-center gap-3 sm:flex-row"
                    >
                        <NuxtLink
                            to="/contact"
                            class="ca-btn-primary"
                            v-motion
                            :initial="{ opacity: 0, y: 10 }"
                            :visible-once="{ opacity: 1, y: 0, transition: { duration: 500 } }"
                        >
                            {{ t('home.readyCTA.ctaPrimary') }}
                        </NuxtLink>
                        <a
                            :href="LINKS.whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary"
                            v-motion
                            :initial="{ opacity: 0, y: 10 }"
                            :visible-once="{ opacity: 1, y: 0, transition: { duration: 500, delay: 100 } }"
                        >
                            {{ t('home.readyCTA.ctaSecondary') }}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
