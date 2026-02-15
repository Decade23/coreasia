<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(1000px_460px_at_12%_0%,rgba(251,191,36,0.16),transparent_62%)]"
                />
                <div
                    class="absolute inset-0 bg-[radial-gradient(850px_480px_at_100%_20%,rgba(30,64,175,0.2),transparent_62%)]"
                />
            </div>

            <div class="ca-container relative ca-section lg:py-28">
                <div
                    class="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center"
                >
                    <div ref="heroText">
                        <span class="ca-kicker">
                            <Icon
                                name="lucide:sparkles"
                                class="h-3.5 w-3.5 text-amber-300"
                            />
                            SaaS LMS for Certification
                        </span>
                        <h1
                            class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.45rem]"
                        >
                            LMS white-label untuk
                            <span class="ca-gradient-text"
                                >sertifikasi online</span
                            >
                            yang siap dijual.
                        </h1>
                        <p class="ca-copy mt-5 max-w-2xl">
                            Solusi end-to-end untuk pendaftaran, assessment, dan
                            sertifikat digital. Dirancang agar team operasional
                            tetap nyaman dari mobile sampai desktop.
                        </p>

                        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                            <NuxtLink to="/contact" class="ca-btn-primary">
                                Request Demo
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
                                WhatsApp Sales
                            </a>
                        </div>

                        <div class="mt-6 flex flex-wrap gap-2">
                            <span class="ca-chip">APL-01 & APL-02 digital</span>
                            <span class="ca-chip">CBT + Essay grading</span>
                            <span class="ca-chip"
                                >QR certificate validation</span
                            >
                        </div>
                    </div>

                    <aside ref="heroPricing" class="ca-card p-4 sm:p-6">
                        <div
                            class="mb-4 flex items-center justify-between gap-3"
                        >
                            <p class="text-sm font-semibold text-slate-200">
                                Quick Pricing Snapshot
                            </p>
                            <span
                                class="rounded-md border border-amber-300/30 bg-amber-300/12 px-2 py-1 text-xs font-semibold text-amber-200"
                            >
                                Best Seller: Professional
                            </span>
                        </div>

                        <div class="grid gap-3">
                            <article
                                class="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                            >
                                <p
                                    class="text-xs uppercase tracking-[0.14em] text-slate-500"
                                >
                                    Essential
                                </p>
                                <p
                                    class="mt-2 font-display text-3xl font-bold text-white"
                                >
                                    Rp 1,5jt<span
                                        class="text-base text-slate-400"
                                        >/bulan</span
                                    >
                                </p>
                                <p class="mt-1 text-sm text-slate-400">
                                    Untuk LSP baru atau skala kecil.
                                </p>
                            </article>
                            <article
                                class="rounded-xl border border-amber-300/35 bg-amber-300/[0.09] p-4"
                            >
                                <p
                                    class="text-xs uppercase tracking-[0.14em] text-amber-200"
                                >
                                    Professional
                                </p>
                                <p
                                    class="mt-2 font-display text-3xl font-bold text-white"
                                >
                                    Rp 3,5jt<span
                                        class="text-base text-slate-200"
                                        >/bulan</span
                                    >
                                </p>
                                <p class="mt-1 text-sm text-amber-100/90">
                                    Volume menengah, fitur lebih lengkap,
                                    support prioritas.
                                </p>
                            </article>
                        </div>

                        <div
                            class="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                        >
                            <p
                                class="text-xs uppercase tracking-[0.14em] text-slate-500"
                            >
                                Termasuk
                            </p>
                            <ul
                                class="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2"
                            >
                                <li class="flex items-center gap-2">
                                    <Icon
                                        name="lucide:check"
                                        class="h-4 w-4 text-emerald-300"
                                    />
                                    Setup onboarding
                                </li>
                                <li class="flex items-center gap-2">
                                    <Icon
                                        name="lucide:check"
                                        class="h-4 w-4 text-emerald-300"
                                    />
                                    Training tim
                                </li>
                                <li class="flex items-center gap-2">
                                    <Icon
                                        name="lucide:check"
                                        class="h-4 w-4 text-emerald-300"
                                    />
                                    Support operasional
                                </li>
                                <li class="flex items-center gap-2">
                                    <Icon
                                        name="lucide:check"
                                        class="h-4 w-4 text-emerald-300"
                                    />
                                    Update platform
                                </li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </section>

        <section class="ca-section pt-4 sm:pt-6">
            <div class="ca-container">
                <div ref="featureHeader" class="mb-8">
                    <span class="ca-kicker">Feature Bento</span>
                    <h2 class="ca-title mt-4">
                        Fitur yang paling sering dipakai tim sertifikasi
                    </h2>
                </div>

                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <article
                        v-for="(feature, index) in features"
                        :key="feature.title"
                        :ref="revealRef('fadeUp', index * 100)"
                        class="ca-card-soft p-5"
                    >
                        <div
                            class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]"
                        >
                            <Icon
                                :name="feature.icon"
                                class="h-5 w-5 text-amber-300"
                            />
                        </div>
                        <h3
                            class="mt-4 text-lg font-display font-semibold text-white"
                        >
                            {{ feature.title }}
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-300">
                            {{ feature.description }}
                        </p>
                    </article>
                </div>
            </div>
        </section>

        <section class="ca-section">
            <div class="ca-container">
                <div ref="pricingHeader" class="mb-8 text-center">
                    <span class="ca-kicker">Pricing</span>
                    <h2 class="ca-title mt-4">
                        Paket yang mudah dipilih, mudah di-upgrade
                    </h2>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                    <article
                        v-for="(plan, index) in plans"
                        :key="plan.name"
                        :ref="revealRef('fadeUp', index * 120)"
                        class="ca-card p-5 sm:p-6"
                        :class="
                            plan.featured
                                ? 'border-amber-300/45 bg-amber-300/[0.08]'
                                : ''
                        "
                    >
                        <div class="flex items-center justify-between gap-2">
                            <h3
                                class="text-lg font-display font-bold text-white"
                            >
                                {{ plan.name }}
                            </h3>
                            <span
                                v-if="plan.featured"
                                class="rounded-md bg-amber-300 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-900"
                            >
                                Best Seller
                            </span>
                        </div>

                        <p class="mt-1 text-sm text-slate-400">
                            {{ plan.audience }}
                        </p>
                        <p
                            class="mt-4 font-display text-3xl font-bold text-white"
                        >
                            {{ plan.price }}
                        </p>

                        <ul class="mt-5 space-y-2 text-sm text-slate-300">
                            <li
                                v-for="item in plan.items"
                                :key="item"
                                class="flex items-start gap-2"
                            >
                                <Icon
                                    :name="
                                        plan.featured
                                            ? 'lucide:check'
                                            : 'lucide:circle-check-big'
                                    "
                                    class="mt-0.5 h-4 w-4 flex-shrink-0"
                                    :class="
                                        plan.featured
                                            ? 'text-amber-200'
                                            : 'text-emerald-300'
                                    "
                                />
                                <span>{{ item }}</span>
                            </li>
                        </ul>

                        <NuxtLink
                            to="/contact"
                            class="mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition"
                            :class="
                                plan.featured
                                    ? 'bg-gradient-to-r from-amber-300 to-amber-400 text-slate-950 hover:brightness-105'
                                    : 'border border-white/15 bg-white/[0.03] text-white hover:border-white/25 hover:bg-white/[0.07]'
                            "
                        >
                            {{ plan.cta }}
                        </NuxtLink>
                    </article>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div ref="faqSection" class="ca-card p-6 sm:p-8">
                    <div
                        class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start"
                    >
                        <div>
                            <span class="ca-kicker">FAQ</span>
                            <h2 class="ca-title mt-4">
                                Pertanyaan yang paling sering muncul sebelum
                                closing
                            </h2>
                            <p class="ca-copy mt-4">
                                Jawaban singkat untuk mempercepat keputusan tim
                                Anda.
                            </p>
                        </div>

                        <div class="space-y-3">
                            <article
                                v-for="faq in faqs"
                                :key="faq.question"
                                class="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                            >
                                <h3
                                    class="text-sm font-semibold text-white sm:text-base"
                                >
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

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div ref="ctaSection" class="ca-card p-6 text-center sm:p-10">
                    <h2
                        class="text-balance font-display text-3xl font-bold text-white sm:text-4xl"
                    >
                        Siap uji live demo dengan skenario bisnis Anda?
                    </h2>
                    <p
                        class="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base"
                    >
                        Tim kami akan tampilkan alur user dari pendaftaran
                        sampai sertifikat, termasuk opsi monetisasi yang paling
                        cocok.
                    </p>
                    <div
                        class="mt-6 flex flex-col justify-center gap-3 sm:flex-row"
                    >
                        <NuxtLink to="/contact" class="ca-btn-primary"
                            >Jadwalkan Demo</NuxtLink
                        >
                        <a
                            :href="LINKS.whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary"
                        >
                            Chat via WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { LINKS } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { useReveal, revealRef } = useScrollReveal()
const { t } = useCoreI18n()

const heroText = useReveal('slideLeft')
const heroPricing = useReveal('slideRight', 150)
const featureHeader = useReveal('fadeUp')
const pricingHeader = useReveal('fadeUp')
const faqSection = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

const features = [
    {
        icon: "lucide:file-text",
        title: "Registrasi APL digital",
        description:
            "Form APL-01 dan APL-02 online dengan upload dokumen yang mudah di-review.",
    },
    {
        icon: "lucide:monitor-play",
        title: "Assessment online",
        description:
            "Ujian pilihan ganda dan essay dengan opsi auto-grading untuk efisiensi asesor.",
    },
    {
        icon: "lucide:award",
        title: "Sertifikat QR secure",
        description:
            "Penerbitan e-certificate dengan validasi QR yang bisa diverifikasi publik.",
    },
    {
        icon: "lucide:users",
        title: "Multi-role workspace",
        description:
            "Akses terpisah untuk Admin, Asesor, dan Manajer Mutu tanpa konflik alur kerja.",
    },
    {
        icon: "lucide:bar-chart-3",
        title: "Operational analytics",
        description:
            "Monitoring kuota asesi, status kelulusan, dan progres pelatihan dalam satu dashboard.",
    },
    {
        icon: "lucide:shield-check",
        title: "Compliance-friendly",
        description:
            "Format data dan laporan dirancang agar lebih mudah disesuaikan kebutuhan audit.",
    },
];

const plans = [
    {
        name: "Essential",
        audience: "LSP baru atau kecil",
        price: "Rp 1,5jt / bulan",
        cta: "Pilih Essential",
        featured: false,
        items: [
            "Hingga 100 asesi/bulan",
            "CBT dasar + e-certificate",
            "1 akun admin",
            "Email support",
        ],
    },
    {
        name: "Professional",
        audience: "LSP berkembang",
        price: "Rp 3,5jt / bulan",
        cta: "Pilih Professional",
        featured: true,
        items: [
            "Hingga 500 asesi/bulan",
            "Multi-role access",
            "Domain custom",
            "WhatsApp support",
        ],
    },
    {
        name: "Enterprise",
        audience: "Korporat dan institusi besar",
        price: "Custom pricing",
        cta: "Hubungi Sales",
        featured: false,
        items: [
            "Unlimited asesi",
            "Server terdedikasi",
            "API integration",
            "SLA support prioritas",
        ],
    },
];

const faqs = [
    {
        question: "Berapa lama waktu implementasi awal?",
        answer: "Rata-rata 3-7 hari kerja untuk setup awal tergantung kesiapan materi dan branding.",
    },
    {
        question: "Apakah bisa pakai domain lembaga sendiri?",
        answer: "Bisa. Paket Professional dan Enterprise mendukung custom domain.",
    },
    {
        question: "Bagaimana jika jumlah peserta meningkat?",
        answer: "Paket dapat di-upgrade kapan saja mengikuti growth volume asesi dan kebutuhan fitur.",
    },
];

useCoreSeo({
    title: "SaaS LMS Platform - Solusi Sertifikasi Online",
    description:
        "Platform LMS white-label untuk lembaga sertifikasi dan training center, lengkap dengan alur pendaftaran, assessment, dan sertifikat digital.",
    path: "/solutions/lms",
});

useSchemaOrg([
    defineWebPage({
        name: "SaaS LMS Platform",
    }),
    defineProduct({
        name: "SertifikasiPro LMS",
    }),
]);
</script>
