<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(1000px_420px_at_15%_0%,rgba(16,185,129,0.2),transparent_60%)]"
                />
                <div
                    class="absolute inset-0 bg-[radial-gradient(820px_460px_at_95%_10%,rgba(14,116,144,0.16),transparent_64%)]"
                />
            </div>

            <div class="ca-container relative ca-section lg:py-28">
                <div
                    class="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center"
                >
                    <div ref="heroText">
                        <span class="ca-kicker">
                            <Icon
                                name="lucide:handshake"
                                class="h-3.5 w-3.5 text-emerald-300"
                            />
                            Venture Partnership
                        </span>
                        <h1
                            class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.45rem]"
                        >
                            Launch bisnis digital dengan
                            <span
                                class="bg-gradient-to-r from-emerald-200 via-emerald-400 to-teal-400 bg-clip-text text-transparent"
                                >model bagi hasil</span
                            >
                            yang transparan.
                        </h1>
                        <p class="ca-copy mt-5 max-w-2xl">
                            Cocok untuk owner yang punya market dan eksekusi
                            bisnis, tetapi ingin meminimalkan beban investasi
                            teknologi di awal.
                        </p>

                        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                            <NuxtLink
                                to="/contact"
                                class="ca-btn-primary-emerald"
                            >
                                Ajukan Partnership
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
                                Diskusi Cepat
                            </a>
                        </div>

                        <div class="mt-6 flex flex-wrap gap-2">
                            <span class="ca-chip">Zero upfront option</span>
                            <span class="ca-chip">Shared execution model</span>
                            <span class="ca-chip"
                                >Growth-aligned incentive</span
                            >
                        </div>
                    </div>

                    <aside ref="heroCard" class="ca-card p-4 sm:p-6">
                        <h2 class="text-lg font-display font-bold text-white">
                            Kenapa model ini relevan sekarang
                        </h2>
                        <p class="mt-2 text-sm text-slate-300">
                            Banyak bisnis gagal scale bukan karena market, tapi
                            karena cost awal product development terlalu berat.
                        </p>

                        <div class="mt-5 grid gap-3">
                            <article
                                class="rounded-xl border border-red-300/25 bg-red-300/[0.08] p-4"
                            >
                                <p
                                    class="text-xs uppercase tracking-[0.14em] text-red-200"
                                >
                                    Build sendiri
                                </p>
                                <p
                                    class="mt-2 font-display text-2xl font-bold text-white"
                                >
                                    Rp 150jt+
                                </p>
                                <p class="mt-1 text-sm text-red-100/90">
                                    Biaya awal, tim teknis, dan maintenance bisa
                                    menekan cashflow.
                                </p>
                            </article>
                            <article
                                class="rounded-xl border border-emerald-300/35 bg-emerald-300/[0.09] p-4"
                            >
                                <p
                                    class="text-xs uppercase tracking-[0.14em] text-emerald-100"
                                >
                                    Venture Partnership
                                </p>
                                <p
                                    class="mt-2 font-display text-2xl font-bold text-white"
                                >
                                    Mulai dari Rp 0
                                </p>
                                <p class="mt-1 text-sm text-emerald-50/90">
                                    Anda fokus growth, kami handle build dan
                                    improvement sistem.
                                </p>
                            </article>
                        </div>
                    </aside>
                </div>
            </div>
        </section>

        <section class="ca-section pt-4 sm:pt-6">
            <div class="ca-container">
                <div ref="stepsHeader" class="mb-8">
                    <span class="ca-kicker">Execution Flow</span>
                    <h2 class="ca-title mt-4">
                        Alur kerja sama yang terstruktur dari awal
                    </h2>
                </div>

                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <article
                        v-for="(step, index) in steps"
                        :key="step.title"
                        :ref="revealRef('fadeUp', index * 100)"
                        class="ca-card-soft p-5"
                    >
                        <span
                            class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-sm font-bold text-white"
                            >{{ index + 1 }}</span
                        >
                        <h3
                            class="mt-4 text-base font-display font-semibold text-white"
                        >
                            {{ step.title }}
                        </h3>
                        <p class="mt-2 text-sm text-slate-300">
                            {{ step.description }}
                        </p>
                    </article>
                </div>
            </div>
        </section>

        <section class="ca-section">
            <div class="ca-container">
                <div class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <div ref="benefitsText" class="space-y-4">
                        <span class="ca-kicker">Strategic Benefits</span>
                        <h2 class="ca-title">
                            Model ini memaksa semua pihak fokus ke hasil
                        </h2>
                        <p class="ca-copy">
                            Insentif Anda dan tim kami diselaraskan ke
                            revenue growth, bukan hanya deliver project selesai.
                        </p>

                        <div class="grid gap-3 sm:grid-cols-2">
                            <article
                                v-for="benefit in benefits"
                                :key="benefit.title"
                                class="ca-card-soft p-4"
                            >
                                <div
                                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]"
                                >
                                    <Icon
                                        :name="benefit.icon"
                                        class="h-4 w-4 text-emerald-300"
                                    />
                                </div>
                                <h3
                                    class="mt-3 text-sm font-semibold text-white sm:text-base"
                                >
                                    {{ benefit.title }}
                                </h3>
                                <p class="mt-1 text-sm text-slate-300">
                                    {{ benefit.description }}
                                </p>
                            </article>
                        </div>
                    </div>

                    <aside ref="benefitsChecklist" class="ca-card p-5 sm:p-6">
                        <p
                            class="text-xs uppercase tracking-[0.14em] text-slate-500"
                        >
                            Partner fit checklist
                        </p>
                        <h3
                            class="mt-2 text-xl font-display font-bold text-white"
                        >
                            Siapa yang biasanya berhasil
                        </h3>

                        <ul class="mt-4 space-y-2 text-sm text-slate-300">
                            <li
                                v-for="item in requirements"
                                :key="item"
                                class="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
                            >
                                <Icon
                                    name="lucide:check-circle-2"
                                    class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300"
                                />
                                <span>{{ item }}</span>
                            </li>
                        </ul>

                        <div
                            class="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                        >
                            <p
                                class="text-xs uppercase tracking-[0.14em] text-slate-500"
                            >
                                Target ideal
                            </p>
                            <p class="mt-2 text-sm text-slate-200">
                                Potensi revenue bisnis minimal Rp 50jt+/bulan
                                dalam fase scale.
                            </p>
                        </div>
                    </aside>
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
                                Pertanyaan sebelum memulai venture model
                            </h2>
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
                        Punya ide dan market? Kita uji kelayakan bersama.
                    </h2>
                    <p
                        class="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base"
                    >
                        Sesi awal fokus pada potensi monetisasi, readiness
                        operasional, dan skema kerjasama yang realistis.
                    </p>
                    <div
                        class="mt-6 flex flex-col justify-center gap-3 sm:flex-row"
                    >
                        <NuxtLink to="/contact" class="ca-btn-primary-emerald"
                            >Ajukan Proposal</NuxtLink
                        >
                        <a
                            :href="LINKS.whatsapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ca-btn-secondary"
                        >
                            Chat WhatsApp
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
const heroCard = useReveal('slideRight', 150)
const stepsHeader = useReveal('fadeUp')
const benefitsText = useReveal('slideLeft')
const benefitsChecklist = useReveal('slideRight', 150)
const faqSection = useReveal('fadeUp')
const ctaSection = useReveal('scaleUp')

const steps = [
    {
        title: "Business discovery",
        description:
            "Diskusi masalah user, positioning produk, dan peluang monetisasi paling realistis.",
    },
    {
        title: "Feasibility review",
        description:
            "Evaluasi potensi pasar, unit economics, dan kesiapan operasional tim Anda.",
    },
    {
        title: "Deal structure",
        description:
            "Menetapkan skema bagi hasil, ruang lingkup, dan milestone eksekusi secara transparan.",
    },
    {
        title: "Build and scale",
        description:
            "Eksekusi produk, testing market, lalu optimasi funnel untuk growth berkelanjutan.",
    },
];

const benefits = [
    {
        icon: "lucide:wallet",
        title: "Lower upfront risk",
        description:
            "Mengurangi tekanan cashflow awal tanpa mengorbankan kualitas produk.",
    },
    {
        icon: "lucide:gauge",
        title: "Faster go-to-market",
        description:
            "Anda tidak perlu mulai dari nol untuk stack teknis dan proses delivery.",
    },
    {
        icon: "lucide:refresh-ccw",
        title: "Continuous iteration",
        description:
            "Produk terus dioptimasi berdasarkan feedback pasar dan data conversion.",
    },
    {
        icon: "lucide:line-chart",
        title: "Aligned incentives",
        description:
            "Semakin bisnis bertumbuh, kedua pihak sama-sama mendapatkan hasil.",
    },
];

const requirements = [
    "Masalah user dan target market sudah jelas",
    "Tim siap menjalankan operasional dan akuisisi user",
    "Komitmen kolaborasi jangka menengah-panjang",
    "Orientasi pada growth berbasis data dan execution discipline",
];

const faqs = [
    {
        question: "Apakah semua bisnis bisa masuk model ini?",
        answer: "Tidak. Kami selektif agar model bagi hasil tetap sehat dan sustainable untuk kedua pihak.",
    },
    {
        question: "Berapa lama sampai bisa launch?",
        answer: "Tergantung kompleksitas, tetapi biasanya fase awal bisa berjalan dalam hitungan minggu, bukan bulan panjang.",
    },
    {
        question: "Bagaimana skema bagi hasil ditentukan?",
        answer: "Skema ditetapkan berdasarkan effort, risiko, biaya operasional, dan target revenue yang disepakati bersama.",
    },
];

useCoreSeo({
    title: "Venture Partner - Revenue Sharing Model",
    description:
        "Program venture partnership CoreAsia untuk bisnis yang ingin tumbuh dengan model bagi hasil dan minim biaya teknologi awal.",
    path: "/solutions/venture",
});

useSchemaOrg([
    defineWebPage({
        name: "Venture Partner Program",
    }),
]);
</script>
