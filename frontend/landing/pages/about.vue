<script setup lang="ts">
import { COMPANY, CONTACT, LINKS } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { useReveal, revealRef } = useScrollReveal()
const { t } = useCoreI18n()

const heroKicker = useReveal('fadeUp', 0)
const heroTitle = useReveal('fadeUp', 100)
const heroCopy = useReveal('fadeUp', 200)
const heroActions = useReveal('fadeUp', 300)
const whyUsHeader = useReveal('fadeUp')
const timelineHeader = useReveal('fadeUp')
const timelineGrid = useReveal('fadeUp', 100)
const leaderText = useReveal('slideLeft')
const leaderImage = useReveal('slideRight', 150)
const ctaSection = useReveal('scaleUp')

useCoreSeo({
    title: 'Tentang Kami - Strategic Technology Partner',
    description: `Mengenal lebih dekat ${COMPANY.name} - mitra transformasi digital untuk lembaga pendidikan dan sertifikasi profesional di Indonesia.`,
    path: '/about',
})

useSchemaOrg([
    defineWebPage({
        name: 'Tentang CoreAsia',
        description: 'Company profile dan visi CoreAsia Teknologi.',
    }),
    defineOrganization({
        name: COMPANY.name,
        url: COMPANY.url,
        logo: `${COMPANY.url}/logos/logo-512.webp`,
        address: {
            addressCountry: 'ID',
            addressLocality: 'Jakarta',
        },
        contactPoint: {
            contactType: 'Customer Service',
            email: CONTACT.email,
            availableLanguage: ['Indonesian', 'English'],
        },
    }),
])

// Timeline data
const journey = [
    {
        year: '2020',
        title: 'Training Center Foundation',
        description: 'Dimulai sebagai pusat pelatihan teknologi dengan fokus pada sertifikasi digital.',
        icon: 'lucide:graduation-cap',
    },
    {
        year: '2022',
        title: 'Technology Integration',
        description: 'Pengembangan sistem manajemen pembelajaran pertama untuk internal use.',
        icon: 'lucide:cpu',
    },
    {
        year: '2024',
        title: 'SaaS Platform Launch',
        description: 'Meluncurkan platform SaaS LMS untuk lembaga sertifikasi di seluruh Indonesia.',
        icon: 'lucide:rocket',
    },
    {
        year: '2026',
        title: 'Infrastructure Provider',
        description: 'Evolusi menjadi mitra infrastruktur teknologi lengkap untuk ekosistem pendidikan.',
        icon: 'lucide:building-2',
    },
]

// Values data
const values = [
    {
        title: 'High Performance',
        description: 'Solusi yang dioptimalkan untuk kecepatan dan skalabilitas maksimal.',
        icon: 'lucide:zap',
        color: 'from-amber-400 to-amber-600',
    },
    {
        title: 'Data Integrity',
        description: 'Keamanan dan integritas data menjadi prioritas utama dalam setiap solusi.',
        icon: 'lucide:shield-check',
        color: 'from-slate-400 to-slate-600',
    },
    {
        title: 'Future Proof',
        description: 'Teknologi yang dirancang untuk berkembang bersama bisnis klien.',
        icon: 'lucide:bar-chart-3',
        color: 'from-emerald-400 to-emerald-600',
    },
]
</script>

<template>
    <div>
        <!-- Hero Section -->
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(1000px_460px_at_15%_0%,rgba(251,191,36,0.15),transparent_62%)]"
                />
                <div
                    class="absolute inset-0 bg-[radial-gradient(900px_440px_at_100%_10%,rgba(30,64,175,0.12),transparent_64%)]"
                />
            </div>

            <!-- Floating Abstract Element -->
            <div class="absolute right-4 top-24 hidden lg:block">
                <div
                    class="h-64 w-64 rounded-full bg-gradient-to-br from-amber-400/20 via-transparent to-emerald-400/20 blur-3xl"
                />
                <div
                    class="absolute inset-0 h-64 w-64 rounded-full border border-white/10 animate-pulse"
                />
            </div>

            <div class="ca-container relative ca-section lg:py-28">
                <div class="max-w-5xl text-center lg:text-left">
                    <span ref="heroKicker" class="ca-kicker">
                        <Icon
                            name="lucide:sparkles"
                            class="h-3.5 w-3.5 text-amber-300"
                        />
                        Visi Kami
                    </span>

                    <h1
                        ref="heroTitle"
                        class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.8rem]"
                    >
                        Membangun Infrastruktur
                        <span class="ca-gradient-text">Digital Masa Depan</span>
                    </h1>

                    <p
                        ref="heroCopy"
                        class="ca-copy mt-5 max-w-3xl text-balance"
                    >
                        {{ COMPANY.name }} adalah tulang punggung teknologi untuk ekosistem
                        pendidikan dan sertifikasi profesional di Indonesia.
                    </p>

                    <div
                        ref="heroActions"
                        class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
                    >
                        <NuxtLink
                            to="/contact"
                            class="ca-btn-primary"
                        >
                            Hubungi Kami
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
                        >
                            <Icon
                                name="lucide:message-circle"
                                class="h-4 w-4"
                            />
                            WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <!-- Why Us Section -->
        <section class="ca-section">
            <div class="ca-container">
                <div ref="whyUsHeader" class="mb-8 text-center">
                    <span class="ca-kicker">Mengapa CoreAsia</span>
                    <h2 class="ca-title mt-4">
                        Solusi Teknologi yang Dirancang untuk Pertumbuhan
                    </h2>
                </div>

                <div class="grid gap-6 md:grid-cols-3">
                    <div
                        v-for="(value, index) in values"
                        :key="value.title"
                        :ref="revealRef('fadeUp', index * 120)"
                        class="group relative overflow-hidden rounded-2xl border border-slate-600/30 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 transition-all duration-300 hover:border-amber-400/50"
                    >
                        <!-- Background gradient effect -->
                        <div
                            class="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            :class="`bg-gradient-to-br ${value.color}/5`"
                        />

                        <!-- Icon -->
                        <div
                            class="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-600/30 bg-white/[0.05]"
                        >
                            <Icon
                                :name="value.icon"
                                class="h-6 w-6 text-amber-300 transition-colors duration-300 group-hover:text-amber-200"
                            />
                        </div>

                        <!-- Content -->
                        <div class="relative z-10">
                            <h3
                                class="mt-4 text-lg font-display font-bold text-white transition-colors duration-300 group-hover:text-amber-200"
                            >
                                {{ value.title }}
                            </h3>
                            <p class="mt-2 text-sm leading-relaxed text-slate-300">
                                {{ value.description }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Journey Timeline -->
        <section class="ca-section">
            <div class="ca-container">
                <div ref="timelineHeader" class="mb-8 text-center">
                    <span class="ca-kicker">Perjalanan Kami</span>
                    <h2 class="ca-title mt-4">
                        Evolusi dari Training Center hingga Infrastructure Provider
                    </h2>
                </div>

                <div ref="timelineGrid" class="relative">
                    <!-- Timeline line (desktop) -->
                    <div
                        class="absolute left-0 right-0 top-12 mx-auto hidden h-[2px] bg-gradient-to-r from-slate-600 via-amber-400 to-emerald-400 md:block lg:left-1/2 lg:h-96 lg:w-0 lg:transform lg:-translate-x-1/2"
                    />

                    <!-- Timeline items -->
                    <div class="space-y-8 md:space-y-0 md:grid md:grid-cols-4 md:gap-4">
                        <div
                            v-for="(item, index) in journey"
                            :key="item.year"
                            :ref="revealRef('fadeUp', index * 150)"
                            class="relative pl-10 md:pl-0 md:text-center"
                        >
                            <!-- Timeline dot (mobile) -->
                            <div
                                class="absolute left-0 top-3 hidden h-2 w-full bg-gradient-to-r from-slate-600 via-amber-400 to-emerald-400 md:left-1/2 md:top-4 md:block md:h-2 md:w-8 md:transform md:-translate-x-1/2"
                            />

                            <!-- Timeline dot center -->
                            <div
                                class="absolute left-0 top-3 hidden h-3 w-3 rounded-full border-2 border-slate-900 bg-gradient-to-br from-slate-600 via-amber-400 to-emerald-400 md:left-1/2 md:top-3 md:block md:h-4 md:w-4 md:transform md:-translate-x-1/2 md:border-slate-900 md:border-2"
                            />

                            <!-- Content -->
                            <div class="relative">
                                <!-- Icon background -->
                                <div
                                    class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600/30 bg-white/[0.05]"
                                >
                                    <Icon
                                        :name="item.icon"
                                        class="h-5 w-5 text-amber-300"
                                    />
                                </div>

                                <h3
                                    class="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-slate-400"
                                >
                                    {{ item.year }}
                                </h3>
                                <h4
                                    class="mt-1 text-lg font-display font-bold text-white"
                                >
                                    {{ item.title }}
                                </h4>
                                <p class="mt-2 text-sm leading-relaxed text-slate-300">
                                    {{ item.description }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Leadership Section -->
        <section class="ca-section">
            <div class="ca-container">
                <div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div ref="leaderText">
                        <span class="ca-kicker">Leadership</span>
                        <h2 class="ca-title mt-4">
                            Visi yang Dipimpin oleh Teknologi
                        </h2>
                        <p class="ca-copy mt-4">
                            Dedi - Founder & Principal Tech Lead. Seorang teknolog enthusiast dengan
                            visi untuk mengintegrasikan pendidikan dengan solusi SaaS
                            yang cutting-edge.
                        </p>

                        <div class="mt-6 flex flex-wrap gap-2">
                            <span class="ca-chip">10+ Years Experience</span>
                            <span class="ca-chip">SaaS Architecture</span>
                            <span class="ca-chip">Education Technology</span>
                        </div>
                    </div>

                    <div ref="leaderImage" class="relative lg:pl-12">
                        <!-- Background halo effect -->
                        <div
                            class="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-400/20 via-transparent to-emerald-400/20 blur-2xl"
                        />

                        <!-- Profile image placeholder -->
                        <div class="relative overflow-hidden rounded-3xl border border-slate-600/30 bg-white/[0.05] p-1">
                            <div
                                class="aspect-square w-full max-w-sm rounded-2xl border border-slate-600/20 bg-gradient-to-br from-slate-800 to-slate-900 md:aspect-[4/5]"
                            >
                                <div
                                    class="flex h-full items-center justify-center text-slate-400"
                                >
                                    <Icon
                                        name="lucide:user"
                                        class="h-16 w-16"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="ca-section pt-0">
            <div class="ca-container">
                <div ref="ctaSection" class="ca-card p-8 text-center sm:p-10">
                    <h2
                        class="text-balance font-display text-3xl font-bold text-white sm:text-4xl"
                    >
                        Siap mentransformasi bisnis Anda?
                    </h2>
                    <p
                        class="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base"
                    >
                        Diskusikan kebutuhan teknologi pendidikan Anda dengan tim ahli kami.
                        Kami siap membantu dari konsep hingga implementasi.
                    </p>
                    <div
                        class="mt-6 flex flex-col justify-center gap-3 sm:flex-row"
                    >
                        <NuxtLink
                            to="/contact"
                            class="ca-btn-primary"
                        >
                            Hubungi Kami
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
                        >
                            <Icon
                                name="lucide:message-circle"
                                class="h-4 w-4"
                            />
                            WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
