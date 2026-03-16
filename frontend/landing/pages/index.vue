<script setup lang="ts">
import { LINKS } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { t } = useCoreI18n()
const { useReveal } = useScrollReveal()

const ctaSection = useReveal('scaleUp')
const featuredProducts = computed(() => ((t('home.products.items') as Array<Record<string, any>>) || []).slice(0, 3))

const heroCardRefs = ref<HTMLElement[]>([])
const heroMousePositions = ref(Array.from({ length: 3 }, () => ({ x: 0, y: 0 })))

const updateHeroSpotlight = (index: number, event: MouseEvent) => {
    const card = heroCardRefs.value[index]
    if (!card) return
    const rect = card.getBoundingClientRect()
    heroMousePositions.value[index] = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    }
}

const resetHeroSpotlight = (index: number) => {
    heroMousePositions.value[index] = { x: 0, y: 0 }
}

useCoreSeo({
    title: t('home.title') as string,
    description: t('home.description') as string,
    path: '/',
})

useSchemaOrg([
    defineWebPage({
        name: 'CoreAsia Product Ecosystem',
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
                            <div class="ca-scene-grid absolute inset-0"></div>
                            <div class="ca-scene-glow ca-light-soft-blend absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"></div>
                            <div class="ca-scene-base absolute inset-0 -z-10" />
                        </div>
                    </template>
                </ClientOnly>
            </div>

            <div class="ca-container relative ca-section lg:py-28">
                <div class="mx-auto max-w-4xl text-center">
                    <span class="ca-kicker animate-fade-in-up min-h-[32px]">
                        <Icon
                            name="lucide:sparkles"
                            class="h-3.5 w-3.5 ca-tone-gold"
                        />
                        <TypewriterEffect :text="t('home.kicker')" />
                    </span>

                    <h1
                        class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.6rem] animate-fade-in-up delay-100"
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

                    <div class="mt-6 animate-fade-in-up delay-350">
                        <p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--ca-subtle)]">
                            {{ t('home.products.kicker') }}
                        </p>
                        <div class="mt-3 grid gap-3 text-left sm:grid-cols-3">
                            <NuxtLink
                                v-for="(product, index) in featuredProducts"
                                :key="product.name"
                                :ref="(el: any) => { if (el) heroCardRefs[index] = el.$el || el }"
                                :to="product.to"
                                class="ca-card-soft group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--ca-gold-border)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)]"
                                @mousemove="updateHeroSpotlight(index, $event)"
                                @mouseleave="resetHeroSpotlight(index)"
                            >
                                <div
                                    class="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                                    :style="{
                                        background: `radial-gradient(320px circle at ${heroMousePositions[index].x}px ${heroMousePositions[index].y}px, var(--ca-spotlight), transparent 42%)`,
                                    }"
                                />

                                <div class="relative z-10 flex items-center gap-3">
                                    <div class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
                                        <Icon
                                            :name="index === 0 ? 'lucide:graduation-cap' : index === 1 ? 'lucide:bar-chart-3' : 'lucide:briefcase-business'"
                                            class="h-4 w-4 ca-tone-gold"
                                        />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h3 class="text-sm font-display font-bold text-[var(--ca-text)] truncate">
                                            {{ product.name }}
                                        </h3>
                                        <span class="text-[0.68rem] text-[var(--ca-muted)]">{{ product.badge }}</span>
                                    </div>
                                    <Icon name="lucide:arrow-right" class="h-4 w-4 flex-shrink-0 text-[var(--ca-subtle)] transition-all group-hover:translate-x-0.5 group-hover:text-[var(--ca-gold-text)]" />
                                </div>
                            </NuxtLink>
                        </div>
                    </div>

                    <p class="mt-4 text-xs font-medium text-[var(--ca-subtle)] animate-fade-in delay-400">
                        <Icon name="lucide:shield-check" class="mr-1 inline-block h-3 w-3 ca-tone-emerald" />
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

        <HomeEcosystem />

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div
                    ref="ctaSection"
                    class="ca-card p-6 text-center sm:p-10"
                >
                    <h2 class="text-balance font-display text-3xl font-bold text-[var(--ca-text)] sm:text-4xl">
                        {{ t('home.readyCTA.title') }}
                    </h2>
                    <p class="mx-auto mt-3 max-w-2xl text-sm text-[var(--ca-muted)] sm:text-base">
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
