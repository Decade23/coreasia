<script setup lang="ts">
import { useCoreI18n } from '~/composables/useCoreI18n'
import { useGatewayApi } from '~/composables/useGatewayApi'
import type { PricingPlan } from '~/composables/useGatewayApi'

const { t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()
const { fetchPlans } = useGatewayApi()

const heroKicker = useReveal('fadeUp', 0)
const heroTitle = useReveal('fadeUp', 100)
const heroCopy = useReveal('fadeUp', 200)
const faqSection = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

useCoreSeo({
    title: 'Harga & Paket Layanan',
    description: 'Pilih paket CoreAsia LMS yang sesuai kebutuhan organisasi Anda. Mulai dari Rp 750.000/bulan dengan 14 hari trial gratis.',
    path: '/pricing',
})

useSchemaOrg([
    defineWebPage({
        name: 'Pricing - CoreAsia Teknologi',
    }),
])

const plans = ref<PricingPlan[]>([])

onMounted(async () => {
    plans.value = await fetchPlans()
})

const faqs = [
    {
        question: 'Apakah ada trial gratis?',
        answer: 'Ya, paket Starter menyediakan 14 hari trial gratis dengan fitur lengkap. Tidak perlu kartu kredit untuk memulai. Anda bisa langsung mendaftar dan mencoba semua fitur dasar.',
    },
    {
        question: 'Bagaimana cara upgrade atau downgrade plan?',
        answer: 'Anda bisa mengubah plan kapan saja melalui dashboard admin. Perubahan plan akan berlaku di siklus billing berikutnya. Tidak ada biaya tambahan untuk proses upgrade.',
    },
    {
        question: 'Apakah data saya aman?',
        answer: 'Setiap tenant memiliki schema database terpisah (multi-tenant isolated). Data dienkripsi dan di-backup secara otomatis setiap hari. Kami mengikuti standar keamanan ISO 27001.',
    },
    {
        question: 'Bisakah saya meminta fitur custom?',
        answer: 'Paket Enterprise menyediakan opsi kustomisasi penuh termasuk custom domain, integrasi API, dan fitur khusus sesuai kebutuhan organisasi Anda. Hubungi tim kami untuk konsultasi.',
    },
    {
        question: 'Apa metode pembayaran yang diterima?',
        answer: 'Kami menerima transfer bank (BCA, Mandiri, BNI, BRI), kartu kredit/debit, dan e-wallet (GoPay, OVO, DANA). Invoice dikirim setiap awal bulan dengan termin 14 hari.',
    },
]
</script>

<template>
    <div>
        <!-- Hero Section -->
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(920px_420px_at_50%_0%,rgba(251,191,36,0.15),transparent_62%)]"
                />
            </div>

            <div class="ca-container relative ca-section pb-10 sm:pb-12 lg:pb-16 text-center">
                <span ref="heroKicker" class="ca-kicker">
                    <Icon name="lucide:sparkles" class="h-3.5 w-3.5 text-amber-300" />
                    Pricing
                </span>
                <h1
                    ref="heroTitle"
                    class="mx-auto mt-5 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.4rem]"
                >
                    Pilih Plan yang Tepat <span class="ca-gradient-text">untuk Anda</span>
                </h1>
                <p ref="heroCopy" class="ca-copy mx-auto mt-5 max-w-2xl">
                    Mulai dari LSP kecil hingga enterprise, kami punya solusi yang tepat.
                    Semua plan termasuk update gratis dan support teknis.
                </p>
            </div>
        </section>

        <!-- Pricing Cards -->
        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-start">
                    <article
                        v-for="(plan, i) in plans"
                        :key="plan.id"
                        :ref="revealRef('fadeUp', i * 120)"
                        class="relative rounded-2xl border backdrop-blur transition-all duration-300"
                        :class="[
                            plan.popular
                                ? 'border-amber-400/40 bg-gradient-to-b from-amber-500/[0.08] to-white/[0.02] shadow-[0_18px_60px_rgba(245,158,11,0.15)]'
                                : 'border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] shadow-[0_18px_60px_rgba(2,6,23,0.42)] hover:border-white/20',
                        ]"
                    >
                        <!-- Popular badge -->
                        <div
                            v-if="plan.popular"
                            class="absolute -top-3.5 left-1/2 -translate-x-1/2"
                        >
                            <span
                                class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-lg"
                            >
                                <Icon name="lucide:crown" class="h-3.5 w-3.5" />
                                {{ plan.badge }}
                            </span>
                        </div>

                        <div class="p-6 sm:p-8">
                            <!-- Plan header -->
                            <div class="mb-6">
                                <h3 class="text-lg font-display font-bold text-white">
                                    {{ plan.name }}
                                </h3>

                                <!-- Trial badge for Starter -->
                                <span
                                    v-if="plan.id === 'starter'"
                                    class="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200"
                                >
                                    <Icon name="lucide:gift" class="h-3 w-3" />
                                    {{ plan.badge }}
                                </span>

                                <!-- Enterprise custom badge -->
                                <span
                                    v-if="plan.id === 'enterprise'"
                                    class="mt-2 inline-flex items-center gap-1 rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-200"
                                >
                                    <Icon name="lucide:building-2" class="h-3 w-3" />
                                    {{ plan.badge }}
                                </span>

                                <div class="mt-4 flex items-baseline gap-1">
                                    <span
                                        class="font-display text-4xl font-bold tracking-tight"
                                        :class="plan.popular ? 'text-amber-200' : 'text-white'"
                                    >
                                        {{ plan.priceLabel }}
                                    </span>
                                    <span class="text-sm text-slate-400">{{ plan.period }}</span>
                                </div>
                            </div>

                            <!-- Divider -->
                            <div
                                class="mb-6 h-px"
                                :class="plan.popular ? 'bg-amber-400/20' : 'bg-white/10'"
                            />

                            <!-- Features -->
                            <ul class="mb-8 space-y-3">
                                <li
                                    v-for="feature in plan.features"
                                    :key="feature.label"
                                    class="flex items-center gap-3 text-sm"
                                >
                                    <span
                                        v-if="feature.included"
                                        class="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15"
                                    >
                                        <Icon
                                            name="lucide:check"
                                            class="h-3.5 w-3.5 text-emerald-300"
                                        />
                                    </span>
                                    <span
                                        v-else
                                        class="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/5"
                                    >
                                        <Icon
                                            name="lucide:minus"
                                            class="h-3.5 w-3.5 text-slate-600"
                                        />
                                    </span>
                                    <span
                                        :class="feature.included ? 'text-slate-200' : 'text-slate-500'"
                                    >
                                        {{ feature.label }}
                                    </span>
                                </li>
                            </ul>

                            <!-- CTA -->
                            <NuxtLink
                                :to="plan.cta.to"
                                class="w-full"
                                :class="[
                                    plan.popular
                                        ? 'ca-btn-primary'
                                        : plan.id === 'enterprise'
                                            ? 'ca-btn-secondary'
                                            : 'ca-btn-primary',
                                ]"
                            >
                                {{ plan.cta.label }}
                                <Icon name="lucide:arrow-right" class="h-4 w-4" />
                            </NuxtLink>
                        </div>
                    </article>
                </div>

                <!-- All plans include note -->
                <p class="mt-8 text-center text-sm text-slate-400">
                    <Icon name="lucide:shield-check" class="mr-1 inline h-4 w-4 text-emerald-400" />
                    Semua plan termasuk SSL gratis, backup harian, dan support teknis via WhatsApp.
                </p>
            </div>
        </section>

        <!-- FAQ Section -->
        <section class="ca-section pt-0">
            <div class="ca-container">
                <div ref="faqSection" class="ca-card p-6 sm:p-8">
                    <div class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                        <div>
                            <span class="ca-kicker">
                                <Icon name="lucide:help-circle" class="h-3.5 w-3.5 text-amber-300" />
                                FAQ
                            </span>
                            <h2 class="ca-title mt-4">
                                Pertanyaan yang Sering Diajukan
                            </h2>
                            <p class="ca-copy mt-3">
                                Belum menemukan jawaban? Hubungi tim kami via
                                <NuxtLink to="/contact" class="font-semibold text-amber-300 underline decoration-amber-300/30 underline-offset-4 transition hover:decoration-amber-300">
                                    halaman kontak
                                </NuxtLink>.
                            </p>
                        </div>
                        <div class="space-y-3">
                            <article
                                v-for="faq in faqs"
                                :key="faq.question"
                                class="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                            >
                                <h3 class="text-sm font-semibold text-white sm:text-base">
                                    {{ faq.question }}
                                </h3>
                                <p class="mt-2 text-sm text-slate-300">
                                    {{ faq.answer }}
                                </p>
                            </article>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Bottom -->
        <section class="ca-section pt-0">
            <div class="ca-container">
                <div ref="ctaSection" class="ca-card p-6 text-center sm:p-10">
                    <h2 class="text-balance font-display text-3xl font-bold text-white sm:text-4xl">
                        Siap Digitalisasi Sertifikasi Anda?
                    </h2>
                    <p class="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                        Mulai 14 hari trial gratis tanpa kartu kredit.
                        Setup dalam 5 menit, langsung gunakan.
                    </p>
                    <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <NuxtLink to="/register?plan=starter" class="ca-btn-primary">
                            Mulai Trial Gratis
                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                        </NuxtLink>
                        <NuxtLink to="/contact" class="ca-btn-secondary">
                            <Icon name="lucide:message-circle" class="h-4 w-4" />
                            Konsultasi Dulu
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
