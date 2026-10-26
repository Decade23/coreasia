<script setup lang="ts">
import { stringifyJsonLd } from '~/utils/public-seo'
const { locale, t } = useCoreI18n()
const { useReveal, revealRef } = useScrollReveal()
const hero = useReveal('fadeUp')
const text = (id: string, en: string) => (locale.value === 'en' ? en : id)
const link = (path: string) => (locale.value === 'en' ? `${path}?lang=en` : path)
interface Estimate {
    type: string
    range: string
    lowPrice: string
    description: string
}
interface ProductPrice {
    name: string
    price: string
    unit?: string
    description?: string
}
const estimates = computed(() => (t('services.jasaPembuatanWebsite.pricing.items') as Estimate[]) || [])
const products = computed(() =>
    [
        { key: 'leadku', name: 'LeadKu', description: text('CRM untuk tim penjualan.', 'CRM for sales teams.') },
        {
            key: 'pantau',
            name: 'Pantau',
            description: text('Analitik dan pemantauan website.', 'Website analytics and monitoring.'),
        },
        {
            key: 'downloader',
            name: 'CoreAsia Download Manager',
            description: text('Kelola unduhan di Mac.', 'Manage downloads on Mac.'),
        },
        {
            key: 'mounter',
            name: 'CoreAsia Mounter',
            description: text('Akses tulis drive NTFS di Mac.', 'Write to NTFS drives on Mac.'),
        },
        {
            key: 'beres',
            name: 'CoreAsia Beres',
            description: text('Alat untuk berkas dan kontak.', 'Tools for files and contacts.'),
        },
    ].map((product) => ({ ...product, plans: (t(`solutions.${product.key}.pricing.plans`) as ProductPrice[]) || [] })),
)
const faqs = computed(() => [
    {
        question: text('Apakah estimasi website merupakan harga akhir?', 'Is the website estimate a final quote?'),
        answer: text(
            'Belum. Jumlah halaman, isi, fitur dan integrasi dibahas sebelum penawaran disepakati. Biaya domain, hosting dan perawatan dijelaskan terpisah dalam lingkup pengerjaan.',
            'No. Pages, content, features, and integrations are discussed before a quote is agreed. Domain, hosting, and maintenance costs are specified separately in the scope.',
        ),
    },
    {
        question: text(
            'Apakah harga produk dan jasa memakai cara bayar yang sama?',
            'Do products and development services use the same billing model?',
        ),
        answer: text(
            'Setiap produk memiliki ketentuan sendiri. Ada langganan, lisensi sekali bayar, atau kredit pemakaian. Halaman produk menjelaskan masa aktif, batas pemakaian dan proses pembeliannya.',
            'Each product has its own terms: subscriptions, one-time licenses, or usage credits. Its product page explains duration, limits, and purchasing.',
        ),
    },
    {
        question: text(
            'Belum tahu jenis website atau aplikasi yang dibutuhkan?',
            'Not sure which website or application you need?',
        ),
        answer: text(
            'Ceritakan pekerjaan yang ingin dibuat lebih mudah. Kami bantu membahas kebutuhan awal sebelum menentukan fitur dan anggaran.',
            'Tell us which part of your work you want to make easier. We can discuss the initial needs before choosing features and a budget.',
        ),
    },
])
useCoreSeo(() => ({
    title: text(
        'Harga Jasa Website, Aplikasi Web & Produk CoreAsia',
        'Website Development, Web Application & Product Pricing',
    ),
    description: text(
        'Lihat estimasi jasa website mulai Rp3 juta, aplikasi web custom, serta paket produk CoreAsia. Bahas lingkup dan biaya sebelum memulai.',
        'Explore website development estimates, custom web application costs, and CoreAsia product plans. Agree on scope and costs before starting.',
    ),
    path: '/pricing',
}))
useHead(() => ({
    script: [
        {
            type: 'application/ld+json',
            innerHTML: stringifyJsonLd({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.value.map((item) => ({
                    '@type': 'Question',
                    name: item.question,
                    acceptedAnswer: { '@type': 'Answer', text: item.answer },
                })),
            }),
        },
    ],
}))
</script>
<template>
    <div>
        <section class="ca-section">
            <div ref="hero" class="ca-container text-center">
                <span class="ca-kicker">{{ text('Harga dan lingkup', 'Pricing and scope') }}</span>
                <h1 class="ca-title mx-auto mt-5 max-w-4xl">
                    {{
                        text(
                            'Rencanakan website, aplikasi, atau produk yang kamu butuhkan.',
                            'Plan the website, application, or product you need.',
                        )
                    }}
                </h1>
                <p class="ca-copy mx-auto mt-5 max-w-2xl">
                    {{
                        text(
                            'Mulai dari gambaran biaya. Kita bahas lingkup pekerjaan dan kebutuhan tim sebelum menentukan pilihan.',
                            'Start with an idea of the cost. We can discuss your scope and team needs before you decide.',
                        )
                    }}
                </p>
                <div class="mt-6 flex flex-wrap justify-center gap-3">
                    <a href="#jasa" class="ca-btn-secondary">
                        {{ text('Jasa website & aplikasi', 'Website & application services') }}
                    </a>
                    <a href="#produk" class="ca-btn-secondary">{{ text('Paket produk', 'Product plans') }}</a>
                </div>
            </div>
        </section>
        <section id="jasa" class="ca-section pt-0 scroll-mt-24">
            <div class="ca-container">
                <h2 class="ca-title">{{ t('services.jasaPembuatanWebsite.pricing.title') }}</h2>
                <p class="ca-copy mt-3 max-w-3xl">{{ t('services.jasaPembuatanWebsite.pricing.subtitle') }}</p>
                <div class="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <article
                        v-for="(item, i) in estimates"
                        :key="item.type"
                        :ref="revealRef('fadeUp', i * 70)"
                        class="ca-card flex flex-col p-6"
                    >
                        <span class="text-xs text-[var(--ca-subtle)]">
                            {{ text('Estimasi awal', 'Initial estimate') }}
                        </span>
                        <h3 class="mt-3 font-display text-xl font-bold">{{ item.type }}</h3>
                        <p class="my-5 font-display text-2xl font-bold">{{ item.range }}</p>
                        <p class="mb-6 text-sm leading-relaxed text-[var(--ca-muted)]">{{ item.description }}</p>
                        <NuxtLink :to="link('/contact')" class="ca-btn-secondary mt-auto">
                            {{ text('Bahas kebutuhan', 'Discuss your needs') }}
                        </NuxtLink>
                    </article>
                </div>
                <p class="mt-5 text-sm text-[var(--ca-muted)]">{{ t('services.jasaPembuatanWebsite.pricing.note') }}</p>
                <div class="mt-5 flex flex-wrap gap-5 text-sm font-semibold">
                    <NuxtLink :to="link('/layanan/jasa-pembuatan-website')" class="ca-tone-gold">
                        {{ text('Lihat lingkup jasa website', 'Explore website services') }}
                    </NuxtLink>
                    <NuxtLink :to="link('/layanan/jasa-pembuatan-aplikasi-web')" class="ca-tone-gold">
                        {{ text('Lihat jasa aplikasi web', 'Explore web application services') }}
                    </NuxtLink>
                    <NuxtLink to="/artikel/berapa-biaya-pembuatan-website-perusahaan" class="ca-tone-gold">
                        {{ text('Panduan menyusun anggaran', 'Website budgeting guide (Indonesian)') }}
                    </NuxtLink>
                </div>
            </div>
        </section>
        <section id="produk" class="ca-section pt-0 scroll-mt-24">
            <div class="ca-container">
                <h2 class="ca-title">{{ text('Harga produk CoreAsia', 'CoreAsia product pricing') }}</h2>
                <p class="ca-copy mt-3 max-w-3xl">
                    {{
                        text(
                            'Paket berikut memakai daftar yang sama dengan halaman masing-masing produk. Periksa fitur, batas pemakaian dan ketentuannya sebelum membeli.',
                            'These plans use the same catalog as each product page. Review features, usage limits, and terms before purchasing.',
                        )
                    }}
                </p>
                <div class="mt-7 grid gap-6 lg:grid-cols-2">
                    <article v-for="product in products" :key="product.key" class="ca-card flex flex-col p-6 sm:p-7">
                        <h3 class="font-display text-2xl font-bold">{{ product.name }}</h3>
                        <p class="mt-2 text-sm text-[var(--ca-muted)]">{{ product.description }}</p>
                        <ul class="my-6 divide-y divide-[var(--ca-border)]">
                            <li
                                v-for="plan in product.plans"
                                :key="plan.name"
                                class="flex flex-wrap justify-between gap-2 py-3 text-sm"
                            >
                                <span>
                                    {{ plan.name }}
                                    <small v-if="plan.unit" class="mt-1 block text-[var(--ca-subtle)]">
                                        {{ plan.unit }}
                                    </small>
                                </span>
                                <strong>{{ plan.price }}</strong>
                            </li>
                        </ul>
                        <NuxtLink :to="link(`/products/${product.key}`)" class="ca-btn-secondary mt-auto">
                            {{ text('Lihat fitur dan paket', 'View features and plans') }}
                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                        </NuxtLink>
                    </article>
                </div>
                <p class="mt-5 text-sm text-[var(--ca-muted)]">
                    {{
                        text(
                            'CoreAsia LMS masih disiapkan. Informasi paketnya akan diterbitkan saat produk tersedia.',
                            'CoreAsia LMS is in preparation. Plans will be published when the product becomes available.',
                        )
                    }}
                </p>
            </div>
        </section>
        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="ca-card p-6 sm:p-8">
                    <h2 class="font-display text-2xl font-bold">{{ text('Sebelum memulai', 'Before you begin') }}</h2>
                    <details
                        v-for="faq in faqs"
                        :key="faq.question"
                        class="border-b border-[var(--ca-border)] py-5 last:border-0"
                    >
                        <summary class="cursor-pointer font-semibold">{{ faq.question }}</summary>
                        <p class="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--ca-muted)]">{{ faq.answer }}</p>
                    </details>
                </div>
                <div class="mt-7 text-center">
                    <NuxtLink :to="link('/contact')" class="ca-btn-primary">
                        {{ text('Diskusikan kebutuhan', 'Discuss your needs') }}
                    </NuxtLink>
                </div>
            </div>
        </section>
    </div>
</template>