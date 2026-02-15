<template>
    <div>
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(920px_420px_at_15%_0%,rgba(251,191,36,0.15),transparent_62%)]"
                />
                <div
                    class="absolute inset-0 bg-[radial-gradient(900px_440px_at_100%_10%,rgba(16,185,129,0.12),transparent_64%)]"
                />
            </div>

            <div
                class="ca-container relative ca-section pb-10 sm:pb-12 lg:pb-16"
            >
                 <span ref="heroKicker" class="ca-kicker">Kontak Kami</span>
                <h1
                    ref="heroTitle"
                    class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.4rem]"
                >
                    Konsultasi strategi produk
                    <span class="ca-gradient-text">tanpa ribet</span>
                </h1>
                <p ref="heroCopy" class="ca-copy mt-5 max-w-3xl">
                    Ceritakan kebutuhan bisnis Anda. Tim kami bantu memetakan
                    opsi paling realistis untuk launch, scale, dan monetisasi.
                </p>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                    <aside ref="contactSidebar" class="space-y-4">
                        <article class="ca-card p-5 sm:p-6">
                            <p
                                class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                            >
                                Respon cepat
                            </p>
                            <h2
                                class="mt-2 text-xl font-display font-bold text-white"
                            >
                                Pilih channel favorit Anda
                            </h2>
                            <p class="mt-2 text-sm text-slate-300">
                                Untuk respon tercepat, gunakan WhatsApp pada jam
                                kerja.
                            </p>

                            <div class="mt-5 space-y-3">
                                <a
                                    :href="LINKS.whatsapp"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-emerald-300/40 hover:bg-emerald-300/10"
                                >
                                    <span class="flex items-center gap-3">
                                        <span
                                            class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/15"
                                        >
                                            <Icon
                                                name="lucide:message-circle"
                                                class="h-5 w-5 text-emerald-300"
                                            />
                                        </span>
                                        <span>
                                            <span
                                                class="block text-sm font-semibold text-white"
                                                >WhatsApp</span
                                            >
                                            <span
                                                class="block text-xs text-slate-400"
                                                >{{ CONTACT.whatsappDisplay }}</span
                                            >
                                        </span>
                                    </span>
                                    <Icon
                                        name="lucide:arrow-up-right"
                                        class="h-4 w-4 text-slate-400"
                                    />
                                </a>

                                <a
                                    :href="LINKS.email"
                                    class="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-amber-300/40 hover:bg-amber-300/10"
                                >
                                    <span class="flex items-center gap-3">
                                        <span
                                            class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15"
                                        >
                                            <Icon
                                                name="lucide:mail"
                                                class="h-5 w-5 text-amber-200"
                                            />
                                        </span>
                                        <span>
                                            <span
                                                class="block text-sm font-semibold text-white"
                                                >Email</span
                                            >
                                            <span
                                                class="block text-xs text-slate-400"
                                                >{{ CONTACT.email }}</span
                                            >
                                        </span>
                                    </span>
                                    <Icon
                                        name="lucide:arrow-up-right"
                                        class="h-4 w-4 text-slate-400"
                                    />
                                </a>
                            </div>
                        </article>

                        <article class="ca-card-soft p-5 sm:p-6">
                            <h3
                                class="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500"
                            >
                                What to prepare
                            </h3>
                            <ul class="mt-4 space-y-2 text-sm text-slate-300">
                                <li class="flex items-start gap-2">
                                    <Icon
                                        name="lucide:check"
                                        class="mt-0.5 h-4 w-4 text-emerald-300"
                                    />
                                    Tujuan bisnis 6-12 bulan ke depan
                                </li>
                                <li class="flex items-start gap-2">
                                    <Icon
                                        name="lucide:check"
                                        class="mt-0.5 h-4 w-4 text-emerald-300"
                                    />
                                    Segment user dan volume target
                                </li>
                                <li class="flex items-start gap-2">
                                    <Icon
                                        name="lucide:check"
                                        class="mt-0.5 h-4 w-4 text-emerald-300"
                                    />
                                    Constraint budget dan timeline
                                </li>
                            </ul>
                            <p class="mt-4 text-xs text-slate-500">
                                Jam operasional: {{ CONTACT.businessHours }}.
                            </p>
                        </article>
                    </aside>

                    <article ref="contactForm" class="ca-card p-5 sm:p-6 lg:p-7">
                        <div class="mb-6">
                            <h2
                                class="text-2xl font-display font-bold text-white"
                            >
                                Kirim Brief Singkat
                            </h2>
                            <p class="mt-2 text-sm text-slate-300">
                                Form ini akan mengarahkan pesan Anda ke
                                WhatsApp/email agar tim dapat menindaklanjuti
                                lebih cepat.
                            </p>
                        </div>

                        <form class="space-y-5" @submit.prevent="handleSubmit">
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        for="name"
                                        class="mb-2 block text-sm font-medium text-slate-200"
                                        >Nama lengkap
                                        <span class="text-rose-300"
                                            >*</span
                                        ></label
                                    >
                                    <input
                                        id="name"
                                        v-model.trim="form.name"
                                        type="text"
                                        required
                                        :disabled="formState.isSubmitting"
                                        class="w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/40 focus:outline-none"
                                        placeholder="Nama Anda"
                                    />
                                </div>
                                <div>
                                    <label
                                        for="email"
                                        class="mb-2 block text-sm font-medium text-slate-200"
                                        >Email
                                        <span class="text-rose-300"
                                            >*</span
                                        ></label
                                    >
                                    <input
                                        id="email"
                                        v-model.trim="form.email"
                                        type="email"
                                        required
                                        :disabled="formState.isSubmitting"
                                        class="w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/40 focus:outline-none"
                                        placeholder="nama@email.com"
                                    />
                                </div>
                            </div>

                            <div class="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        for="phone"
                                        class="mb-2 block text-sm font-medium text-slate-200"
                                        >No. WhatsApp</label
                                    >
                                    <input
                                        id="phone"
                                        v-model.trim="form.phone"
                                        type="tel"
                                        :disabled="formState.isSubmitting"
                                        class="w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/40 focus:outline-none"
                                        placeholder="+62 xxx xxxx xxxx"
                                    />
                                </div>

                                <div>
                                    <label
                                        for="subject"
                                        class="mb-2 block text-sm font-medium text-slate-200"
                                        >Subjek
                                        <span class="text-rose-300"
                                            >*</span
                                        ></label
                                    >
                                    <select
                                        id="subject"
                                        v-model="form.subject"
                                        required
                                        :disabled="formState.isSubmitting"
                                        class="w-full rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-amber-300/40 focus:outline-none"
                                    >
                                        <option
                                            value=""
                                            disabled
                                            class="bg-[#070d18] text-slate-400"
                                        >
                                            Pilih subjek
                                        </option>
                                        <option
                                            v-for="option in subjectOptions"
                                            :key="option.value"
                                            :value="option.value"
                                            class="bg-[#070d18] text-slate-100"
                                        >
                                            {{ option.label }}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label
                                    for="message"
                                    class="mb-2 block text-sm font-medium text-slate-200"
                                    >Pesan
                                    <span class="text-rose-300">*</span></label
                                >
                                <textarea
                                    id="message"
                                    v-model.trim="form.message"
                                    rows="5"
                                    required
                                    :disabled="formState.isSubmitting"
                                    class="w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-300/40 focus:outline-none"
                                    placeholder="Ceritakan kebutuhan utama Anda"
                                />
                            </div>

                            <label
                                class="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-300"
                            >
                                <input
                                    v-model="form.consent"
                                    type="checkbox"
                                    required
                                    :disabled="formState.isSubmitting"
                                    class="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-amber-300 focus:ring-amber-300"
                                />
                                <span>
                                    Saya menyetujui data ini digunakan untuk
                                    tindak lanjut konsultasi.
                                </span>
                            </label>

                            <button
                                type="submit"
                                :disabled="formState.isSubmitting"
                                class="ca-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Icon
                                    v-if="formState.isSubmitting"
                                    name="lucide:loader-2"
                                    class="h-4 w-4 animate-spin"
                                />
                                <Icon
                                    v-else
                                    name="lucide:send"
                                    class="h-4 w-4"
                                />
                                {{
                                    formState.isSubmitting
                                        ? "Memproses..."
                                        : "Kirim Brief"
                                }}
                            </button>

                            <p
                                v-if="formState.isSuccess"
                                class="rounded-lg border border-emerald-300/35 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100"
                                role="status"
                                aria-live="polite"
                            >
                                Brief berhasil diproses. Jika WhatsApp tidak
                                terbuka, cek draft email yang disiapkan
                                otomatis.
                            </p>

                            <p
                                v-if="formState.errorMessage"
                                class="rounded-lg border border-rose-300/35 bg-rose-300/10 px-3 py-2 text-sm text-rose-100"
                                role="alert"
                            >
                                {{ formState.errorMessage }}
                            </p>
                        </form>
                    </article>
                </div>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <article ref="brandSection" class="ca-card p-5 sm:p-6 lg:p-7">
                    <div class="max-w-3xl">
                         <span class="ca-kicker">Brand Assets</span>
                        <h2
                            class="mt-4 text-balance font-display text-3xl font-bold leading-tight text-white sm:text-4xl"
                        >
                            Asset kit terintegrasi untuk kebutuhan
                            <span class="ca-gradient-text"
                                >brand, favicon, dan social share</span
                            >
                        </h2>
                        <p class="mt-3 text-sm leading-relaxed text-slate-300">
                             Seluruh aset resmi tersedia dalam format
                            siap pakai untuk website, PWA, dan channel
                            distribusi konten.
                        </p>
                    </div>

                    <div class="mt-7 grid gap-5 xl:grid-cols-2">
                        <section class="ca-card-soft p-4 sm:p-5">
                            <h3
                                class="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300"
                            >
                                Social Preview Assets
                            </h3>
                            <div class="mt-4 grid gap-3 sm:grid-cols-2">
                                <article
                                    v-for="asset in socialAssets"
                                    :key="asset.path"
                                    class="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                                >
                                    <NuxtImg
                                        :src="asset.path"
                                        :alt="asset.alt"
                                        width="1200"
                                        height="630"
                                        loading="lazy"
                                        decoding="async"
                                        class="aspect-[16/9] w-full rounded-lg border border-white/10 object-cover"
                                    />
                                    <div
                                        class="mt-3 flex items-start justify-between gap-3"
                                    >
                                        <p class="text-xs text-slate-300">
                                            {{ asset.label }}
                                        </p>
                                        <a
                                            :href="asset.path"
                                            :download="
                                                fileNameFromPath(asset.path)
                                            "
                                            class="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-amber-300/40 hover:text-amber-200"
                                        >
                                            <Icon
                                                name="lucide:download"
                                                class="h-3.5 w-3.5"
                                            />
                                            Download
                                        </a>
                                    </div>
                                </article>
                            </div>
                        </section>

                        <section class="ca-card-soft p-4 sm:p-5">
                            <h3
                                class="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300"
                            >
                                Logo Variants
                            </h3>
                            <div class="mt-4 grid gap-3 sm:grid-cols-2">
                                <article
                                    v-for="asset in logoAssets"
                                    :key="asset.path"
                                    class="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                                >
                                    <div
                                        class="grid aspect-square place-items-center rounded-lg border border-white/10 bg-[#02040b] p-3"
                                    >
                                        <NuxtImg
                                            :src="asset.preview || asset.path"
                                            :alt="asset.alt"
                                            width="256"
                                            height="256"
                                            loading="lazy"
                                            decoding="async"
                                            class="max-h-24 w-auto object-contain"
                                        />
                                    </div>
                                    <div
                                        class="mt-3 flex items-start justify-between gap-3"
                                    >
                                        <p class="text-xs text-slate-300">
                                            {{ asset.label }}
                                        </p>
                                        <a
                                            :href="asset.path"
                                            :download="
                                                fileNameFromPath(asset.path)
                                            "
                                            class="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/15 px-2 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-amber-300/40 hover:text-amber-200"
                                        >
                                            <Icon
                                                name="lucide:download"
                                                class="h-3.5 w-3.5"
                                            />
                                            Download
                                        </a>
                                    </div>
                                </article>
                            </div>
                        </section>
                    </div>

                    <div class="mt-5 grid gap-5 xl:grid-cols-2">
                        <section class="ca-card-soft p-4 sm:p-5">
                            <h3
                                class="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300"
                            >
                                Favicon Pack
                            </h3>
                            <ul class="mt-4 grid gap-2 sm:grid-cols-2">
                                <li
                                    v-for="asset in faviconAssets"
                                    :key="asset.path"
                                >
                                    <a
                                        :href="asset.path"
                                        :download="fileNameFromPath(asset.path)"
                                        class="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
                                    >
                                        <span class="truncate">{{
                                            asset.label
                                        }}</span>
                                        <Icon
                                            name="lucide:arrow-down-to-line"
                                            class="h-3.5 w-3.5 shrink-0 text-amber-300"
                                        />
                                    </a>
                                </li>
                            </ul>
                        </section>

                        <section class="ca-card-soft p-4 sm:p-5">
                            <h3
                                class="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300"
                            >
                                App Icons & Tiles
                            </h3>
                            <ul class="mt-4 grid gap-2 sm:grid-cols-2">
                                <li
                                    v-for="asset in appIconAssets"
                                    :key="asset.path"
                                >
                                    <a
                                        :href="asset.path"
                                        :download="fileNameFromPath(asset.path)"
                                        class="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
                                    >
                                        <span class="truncate">{{
                                            asset.label
                                        }}</span>
                                        <Icon
                                            name="lucide:arrow-down-to-line"
                                            class="h-3.5 w-3.5 shrink-0 text-amber-300"
                                        />
                                    </a>
                                </li>
                            </ul>
                        </section>
                    </div>
                </article>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { LINKS, CONTACT, buildWhatsAppUrl, buildMailtoUrl } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'

const { useReveal } = useScrollReveal()
const { t } = useCoreI18n()

const heroKicker = useReveal('fadeUp', 0)
const heroTitle = useReveal('fadeUp', 100)
const heroCopy = useReveal('fadeUp', 200)
const contactSidebar = useReveal('slideLeft')
const contactForm = useReveal('slideRight', 100)
const brandSection = useReveal('fadeUp')

interface ContactForm {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    consent: boolean;
}

const subjectOptions = [
    { value: "demo", label: "Request Demo SaaS LMS" },
    { value: "pricing", label: "Informasi Pricing" },
    { value: "venture", label: "Venture Partnership" },
    { value: "enterprise", label: "Custom Enterprise Solution" },
    { value: "support", label: "Technical Support" },
];

const socialAssets = [
    {
        label: "Open Graph PNG (1200x630)",
        path: "/social/og-image.png",
        alt: "CoreAsia open graph image",
    },
    {
        label: "Open Graph WebP (1200x630)",
        path: "/social/og-image.webp",
        alt: "CoreAsia open graph image webp",
    },
    {
        label: "Twitter Card (1200x600)",
        path: "/social/twitter-card.webp",
        alt: "CoreAsia twitter card image",
    },
    {
        label: "LinkedIn Share (1200x627)",
        path: "/social/linkedin-share.webp",
        alt: "CoreAsia linkedin share image",
    },
    {
        label: "Square Preview (500x500)",
        path: "/social/square-preview.webp",
        alt: "CoreAsia square preview image",
    },
];

const logoAssets = [
    {
        label: "Logo WebP Primary",
        path: "/logos/logo.webp",
        alt: "CoreAsia logo webp",
    },
    {
        label: "Logo PNG Primary",
        path: "/logos/logo.png",
        alt: "CoreAsia logo png",
    },
    {
        label: "Logo 64 WebP",
        path: "/logos/logo-64.webp",
        alt: "CoreAsia logo 64",
    },
    {
        label: "Logo 128 WebP",
        path: "/logos/logo-128.webp",
        alt: "CoreAsia logo 128",
    },
    {
        label: "Logo 256 WebP",
        path: "/logos/logo-256.webp",
        alt: "CoreAsia logo 256",
    },
    {
        label: "Logo 512 WebP",
        path: "/logos/logo-512.webp",
        alt: "CoreAsia logo 512",
    },
    {
        label: "Logo Dark Background",
        path: "/logos/logo-dark-bg.webp",
        alt: "CoreAsia logo dark background",
        preview: "/logos/logo-dark-bg.webp",
    },
    {
        label: "Logo White Background",
        path: "/logos/logo-white-bg.webp",
        alt: "CoreAsia logo white background",
        preview: "/logos/logo-white-bg.webp",
    },
    {
        label: "Logo Vector SVG",
        path: "/logo.svg",
        alt: "CoreAsia logo vector",
        preview: "/logo.svg",
    },
];

const faviconAssets = [
    { label: "Root favicon.ico", path: "/favicon.ico" },
    { label: "Favicon ICO 16x16", path: "/favicons/favicon.ico" },
    { label: "Favicon PNG 16x16", path: "/favicons/favicon-16.png" },
    { label: "Favicon PNG 32x32", path: "/favicons/favicon-32.png" },
    { label: "Favicon PNG 48x48", path: "/favicons/favicon-48.png" },
    { label: "Favicon PNG 64x64", path: "/favicons/favicon-64.png" },
    { label: "Favicon PNG 96x96", path: "/favicons/favicon-96.png" },
    { label: "Favicon PNG 128x128", path: "/favicons/favicon-128.png" },
];

const appIconAssets = [
    { label: "Android Chrome 48x48", path: "/icons/android-chrome-48.png" },
    { label: "Android Chrome 72x72", path: "/icons/android-chrome-72.png" },
    { label: "Android Chrome 96x96", path: "/icons/android-chrome-96.png" },
    { label: "Android Chrome 144x144", path: "/icons/android-chrome-144.png" },
    { label: "Android Chrome 192x192", path: "/icons/android-chrome-192.png" },
    { label: "Android Chrome 512x512", path: "/icons/android-chrome-512.png" },
    { label: "Apple Touch 60x60", path: "/icons/apple-touch-icon-60.png" },
    { label: "Apple Touch 76x76", path: "/icons/apple-touch-icon-76.png" },
    { label: "Apple Touch 120x120", path: "/icons/apple-touch-icon-120.png" },
    { label: "Apple Touch 152x152", path: "/icons/apple-touch-icon-152.png" },
    { label: "Apple Touch 167x167", path: "/icons/apple-touch-icon-167.png" },
    { label: "Apple Touch 180x180", path: "/icons/apple-touch-icon-180.png" },
    { label: "Apple Touch Default", path: "/icons/apple-touch-icon.png" },
    { label: "Maskable 512x512", path: "/icons/maskable-icon-512.png" },
    { label: "Windows Tile 70x70", path: "/icons/mstile-70.png" },
    { label: "Windows Tile 150x150", path: "/icons/mstile-150.png" },
    { label: "Windows Tile 310x310", path: "/icons/mstile-310.png" },
];

const fileNameFromPath = (path: string): string => {
    const parts = path.split("/");
    return parts[parts.length - 1] || path;
};

const form = reactive<ContactForm>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    consent: false,
});

const formState = reactive({
    isSubmitting: false,
    isSuccess: false,
    errorMessage: "",
});

const resetForm = () => {
    form.name = "";
    form.email = "";
    form.phone = "";
    form.subject = "";
    form.message = "";
    form.consent = false;
};

const buildMessage = () => {
    const subjectLabel =
        subjectOptions.find((option) => option.value === form.subject)?.label ||
        form.subject;
    const lines = [
        `Halo CoreAsia, saya ingin konsultasi terkait: ${subjectLabel}.`,
        "",
        `Nama: ${form.name}`,
        `Email: ${form.email}`,
        `WhatsApp: ${form.phone || "-"}`,
        "",
        "Kebutuhan:",
        form.message,
    ];

    return {
        subjectLabel,
        body: lines.join("\n"),
    };
};

const handleSubmit = async () => {
    formState.isSubmitting = true;
    formState.isSuccess = false;
    formState.errorMessage = "";

    if (!form.consent) {
        formState.errorMessage =
            "Persetujuan penggunaan data diperlukan sebelum mengirim brief.";
        formState.isSubmitting = false;
        return;
    }

    try {
        const { subjectLabel, body } = buildMessage();

        if (process.client) {
            const waUrl = buildWhatsAppUrl(body);
            const mailtoUrl = buildMailtoUrl(`[Inquiry] ${subjectLabel}`, body);

            const popup = window.open(waUrl, "_blank", "noopener,noreferrer");
            if (!popup) {
                window.location.href = mailtoUrl;
            }
        }

        formState.isSuccess = true;
        resetForm();

        setTimeout(() => {
            formState.isSuccess = false;
        }, 5000);
    } catch (error) {
        formState.errorMessage =
            "Terjadi kendala saat memproses brief. Silakan hubungi WhatsApp langsung.";
    } finally {
        formState.isSubmitting = false;
    }
};

useCoreSeo({
    title: "Hubungi Kami",
    description:
        "Hubungi tim CoreAsia untuk konsultasi strategis terkait SaaS LMS, venture partnership, dan solusi enterprise.",
    path: "/contact",
    image: "/social/linkedin-share.webp",
    twitterImage: "/social/twitter-card.webp",
});

useSchemaOrg([
    defineWebPage({
        "@type": "ContactPage",
        name: "Hubungi CoreAsia",
        description:
            "Halaman kontak CoreAsia untuk konsultasi SaaS LMS, venture partnership, dan solusi enterprise.",
        url: "https://coreasia.id/contact",
    }),
]);
</script>
