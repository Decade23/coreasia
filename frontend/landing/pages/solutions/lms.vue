<script setup lang="ts">
import { useCoreI18n } from '~/composables/useCoreI18n'
import { LINKS } from '~/utils/constants'

const { t } = useCoreI18n()
const { useReveal } = useScrollReveal()

useCoreSeo({
    title: t('solutions.lms.title') as string,
    description: t('solutions.lms.description') as string,
    path: '/solutions/lms'
})

const features = computed(() => {
    const raw = t('solutions.lms.detailedFeatures') as any[]
    return raw.map(f => ({
        title: f.title,
        desc: f.description,
        icon: f.icon
    }))
})
</script>

<template>
    <div>
        <!-- Hero Section -->
        <section class="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
            <div class="pointer-events-none absolute inset-0">
                 <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-core-950 to-core-950" />
            </div>

            <div class="ca-container relative text-center">
                <span class="ca-kicker mb-6 animate-fade-in-up">{{ t('solutions.lms.kicker') }}</span>
                <h1 class="ca-title mx-auto max-w-4xl animate-fade-in-up delay-100">
                    <span v-html="t('solutions.lms.hero.title')" />
                </h1>
                <p class="ca-copy mx-auto mt-6 max-w-2xl animate-fade-in-up delay-200">
                    {{ t('solutions.lms.hero.subtitle') }}
                </p>

                <div class="mt-8 flex justify-center gap-4 animate-fade-in-up delay-300">
                    <NuxtLink to="/contact" class="ca-btn-primary">
                        {{ t('solutions.lms.hero.ctaPrimary') }}
                        <Icon name="lucide:arrow-right" class="h-4 w-4" />
                    </NuxtLink>
                    <a :href="LINKS.whatsapp" target="_blank" class="ca-btn-secondary">
                        <Icon name="lucide:message-circle" class="h-4 w-4" />
                        {{ t('solutions.lms.hero.ctaSecondary') }}
                    </a>
                </div>
            </div>
        </section>

        <!-- Feature Grid -->
        <section class="ca-section bg-white/[0.02]">
            <div class="ca-container">
                <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div 
                        v-for="(feature, i) in features" 
                        :key="i"
                        class="ca-card p-6 transition hover:border-amber-500/30"
                    >
                        <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                            <Icon :name="feature.icon" class="h-6 w-6" />
                        </div>
                        <h3 class="mb-2 text-lg font-bold text-white">{{ feature.title }}</h3>
                        <p class="text-sm text-slate-400 leading-relaxed">{{ feature.desc }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA / Bottom -->
        <section class="ca-section text-center">
            <div class="ca-container">
                <div class="ca-card-soft p-10">
                    <h2 class="text-2xl font-bold text-white">{{ t('solutions.lms.cta.title') }}</h2>
                    <p class="mt-2 text-slate-400">{{ t('solutions.lms.cta.subtitle') }}</p>
                    <div class="mt-6">
                        <NuxtLink to="/contact" class="ca-btn-primary">{{ t('solutions.lms.cta.button') }}</NuxtLink>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>