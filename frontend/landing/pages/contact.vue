<script setup lang="ts">
import { LINKS, CONTACT, COMPANY, buildWhatsAppUrl } from '~/utils/constants'
import { useCoreI18n } from '~/composables/useCoreI18n'
import { useAnalytics } from '~/composables/useAnalytics'

const { useReveal } = useScrollReveal()
const { t } = useCoreI18n()
const { trackFormStart, trackLeadSaved, trackWhatsAppClick } = useAnalytics()
const { getAttribution } = useLeadAttribution()
const { trackLeadConversion } = useGoogleAdsConversion()
const route = useRoute()
const config = useRuntimeConfig()

const publicApiBase = (import.meta.client
    ? config.public.gatewayPublicUrl
    : config.public.gatewayUrl
) as string

const heroKicker = useReveal('fadeUp', 0)
const heroTitle = useReveal('fadeUp', 100)
const heroCopy = useReveal('fadeUp', 200)
const contactSidebar = useReveal('slideLeft')
const contactForm = useReveal('slideRight', 100)

interface ContactForm {
    name: string;
    email: string;
    phone: string;
    subject: string;
    budgetRange: string;
    message: string;
    consent: boolean;
}

const subjectOptions = computed(() => {
    const subjects = t('contact.form.subjects') as Record<string, string>
    return Object.entries(subjects).map(([value, label]) => ({
        value,
        label: label as string,
    }))
})

const budgetOptions = computed(() => {
    const ranges = t('contact.form.budgetRanges') as Record<string, string>
    return Object.entries(ranges).map(([value, label]) => ({
        value,
        label: label as string,
    }))
})

const form = reactive<ContactForm>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    budgetRange: "",
    message: "",
    consent: false,
});

watchEffect(() => {
    const rawSubject = Array.isArray(route.query.subject)
        ? route.query.subject[0]
        : route.query.subject

    if (typeof rawSubject !== 'string' || form.subject) {
        return
    }

    const hasMatchingSubject = subjectOptions.value.some((option) => option.value === rawSubject)
    if (hasMatchingSubject) {
        form.subject = rawSubject
    }
})

const formState = reactive({
    isSubmitting: false,
    isSuccess: false,
    hasSubmissionError: false,
    successWhatsAppUrl: "",
    errorMessage: "",
});

const selectedPlan = computed(() => {
    const rawPlan = Array.isArray(route.query.plan)
        ? route.query.plan[0]
        : route.query.plan

    return typeof rawPlan === 'string' ? rawPlan : ''
})

const hasTrackedFormStart = ref(false)

watch(
    () => [form.name, form.email, form.phone, form.message],
    (values) => {
        if (hasTrackedFormStart.value) {
            return
        }

        const hasStarted = values.some((value) => value.trim().length > 0)
        if (!hasStarted) {
            return
        }

        hasTrackedFormStart.value = true
        trackFormStart('contact_brief', {
            subject: form.subject || undefined,
            plan: selectedPlan.value || undefined,
        })
    },
)

// Computed property for phone input handling
const phoneModel = computed({
    get: () => form.phone,
    set: (val) => {
        if (!val) {
            form.phone = "";
            return;
        }

        // 1. Sanitize: Allow only digits and leading +
        let raw = val.replace(/[^0-9+]/g, "");
        
        // Prevent multiple +
        if ((raw.match(/\+/g) || []).length > 1) {
             raw = raw.replace(/\+/g, (match, offset) => offset === 0 ? "+" : "");
        }

        // 2. Normalize prefixes to +62 (only if it looks like ID number)
        if (raw.startsWith("08")) {
            raw = "+62" + raw.slice(1);
        } else if (raw.startsWith("628")) {
            raw = "+" + raw;
        } else if (raw.startsWith("8")) {
            raw = "+62" + raw;
        }

        // Ensure leading + if not empty
         if (!raw.startsWith("+") && raw.length > 0) {
             raw = "+" + raw;
        }

        // 3. Formatting (Spacing)
        let formatted = raw;
        if (raw.startsWith("+62")) {
            const rest = raw.slice(3);
            const chunks = [];
            if (rest.length > 0) chunks.push(rest.slice(0, 3));
            if (rest.length > 3) chunks.push(rest.slice(3, 7));
            if (rest.length > 7) chunks.push(rest.slice(7, 13)); 
            formatted = "+62 " + chunks.join(" ");
        }

        // 4. Update state
        form.phone = formatted.trim();
    }
});

const resetForm = () => {
    form.name = "";
    form.email = "";
    form.phone = "";
    form.subject = "";
    form.budgetRange = "";
    form.message = "";
    form.consent = false;
    hasTrackedFormStart.value = false;
};

const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const buildMessage = () => {
    const subjectLabel =
        subjectOptions.value.find((option) => option.value === form.subject)?.label ||
        form.subject;

    const cleanPhone = form.phone ? form.phone.replace(/\s+/g, "") : "-";

    const template = t('contact.form.messages.whatsappTemplate') as string;
    const body = template
        .replace('{subject}', subjectLabel)
        .replace('{name}', form.name)
        .replace('{email}', form.email)
        .replace('{phone}', cleanPhone)
        .replace('{message}', form.message);

    return body;
};

const whatsappFallbackUrl = computed(() => buildWhatsAppUrl(buildMessage()));

interface CreateLeadResponse {
    success: boolean;
    lead_id: string;
    status: string;
}

const handleSubmit = async () => {
    formState.isSubmitting = true;
    formState.isSuccess = false;
    formState.hasSubmissionError = false;
    formState.successWhatsAppUrl = "";
    formState.errorMessage = "";

    if (!form.name.trim()) {
        formState.errorMessage = t('contact.form.validation.nameRequired') as string;
        formState.isSubmitting = false;
        return;
    }

    if (!form.email.trim()) {
        formState.errorMessage = t('contact.form.validation.emailRequired') as string;
        formState.isSubmitting = false;
        return;
    }

    if (!isValidEmail(form.email.trim())) {
        formState.errorMessage = t('contact.form.validation.emailInvalid') as string;
        formState.isSubmitting = false;
        return;
    }

    if (!form.subject.trim()) {
        formState.errorMessage = t('contact.form.validation.subjectRequired') as string;
        formState.isSubmitting = false;
        return;
    }

    if (!form.message.trim()) {
        formState.errorMessage = t('contact.form.validation.messageRequired') as string;
        formState.isSubmitting = false;
        return;
    }

    if (!form.consent) {
        formState.errorMessage = t('contact.form.validation.consentRequired') as string;
        formState.isSubmitting = false;
        return;
    }

    try {
        const body = buildMessage();
        const attribution = getAttribution();
        const cleanPhone = form.phone.replace(/\s+/g, "").trim();
        const apiBase = publicApiBase.replace(/\/+$/, "");

        const response = await $fetch<CreateLeadResponse>(`${apiBase}/public/leads`, {
            method: "POST",
            body: {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                phone: cleanPhone,
                subject: form.subject.trim(),
                budget_range: form.budgetRange || undefined,
                message: form.message.trim(),
                consent: form.consent,
                utm_source: attribution?.utm_source || "",
                utm_medium: attribution?.utm_medium || "",
                utm_campaign: attribution?.utm_campaign || "",
                utm_term: attribution?.utm_term || "",
                utm_content: attribution?.utm_content || "",
                gclid: attribution?.gclid || "",
                fbclid: attribution?.fbclid || "",
                landing_page: attribution?.landing_page || window.location.href,
                referrer: attribution?.referrer || "",
            },
        });

        if (!response.success || !response.lead_id) {
            throw new Error("Lead API returned an invalid success response");
        }

        // A form submission becomes a conversion only after the lead is durably
        // accepted by the API. Failed requests must never inflate ad results.
        formState.isSuccess = true;
        formState.successWhatsAppUrl = buildWhatsAppUrl(body);
        trackLeadSaved(response.lead_id, 'contact_brief', {
            subject: form.subject,
            plan: selectedPlan.value || undefined,
        })
        trackLeadConversion(response.lead_id)

        if (import.meta.client) {
            try {
                const confetti = (await import('canvas-confetti')).default;
                
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 9999
                });
            } catch (e) {
                console.error("Failed to load confetti:", e);
            }
        }
        
        resetForm();
    } catch {
        formState.errorMessage = t('contact.form.error') as string;
        formState.hasSubmissionError = true;
    } finally {
        formState.isSubmitting = false;
    }
};

useCoreSeo({
    title: t('contact.title') as string,
    description: t('contact.description') as string,
    path: "/contact",
    image: "/social/linkedin-share.webp",
    // Kartu LinkedIn kami 1200x627 dan benar-benar WebP, beda dari bawaan
    // 1200x630 PNG. Deklarasi harus ikut berkasnya, bukan sebaliknya.
    ogImageWidth: 1200,
    ogImageHeight: 627,
    ogImageType: "image/webp",
    twitterImage: "/social/twitter-card.webp",
});

useSchemaOrg([
    defineWebPage({
        "@type": "ContactPage",
        name: t('contact.schema.name') as string,
        description: t('contact.schema.description') as string,
        url: `${COMPANY.url}/contact`,
    }),
]);
</script>

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
                class="ca-container relative ca-section pt-6 sm:pt-8 pb-10 sm:pb-12 lg:pb-16"
            >
                <span ref="heroKicker" class="ca-kicker">{{ t('contact.kicker') }}</span>
                <h1
                    ref="heroTitle"
                    class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl lg:text-[3.4rem]"
                    v-html="t('contact.hero.title')"
                />
                <p ref="heroCopy" class="ca-copy mt-5 max-w-3xl">
                    {{ t('contact.hero.subtitle') }}
                </p>
            </div>
        </section>

        <section class="ca-section pt-0">
            <div class="ca-container">
                <div class="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                    <aside ref="contactSidebar" class="space-y-4">
                        <article class="ca-card p-5 sm:p-6">
                            <p
                                class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]"
                            >
                                {{ t('contact.channels.quickResponse') }}
                            </p>
                            <h2
                                class="mt-2 text-xl font-display font-bold text-[var(--ca-text)]"
                            >
                                {{ t('contact.channels.title') }}
                            </h2>
                            <p class="mt-2 text-sm text-[var(--ca-muted)]">
                                {{ t('contact.channels.subtitle') }}
                            </p>

                            <div class="mt-5 space-y-3">
                                <a
                                    :href="LINKS.whatsapp"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="flex items-center justify-between rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-4 py-3 transition hover:border-emerald-300/40 hover:bg-emerald-300/10"
                                    @click="trackWhatsAppClick('contact_sidebar')"
                                >
                                    <span class="flex items-center gap-3">
                                        <span class="ca-icon-emerald inline-flex h-10 w-10 items-center justify-center rounded-lg">
                                            <Icon name="lucide:message-circle" class="h-5 w-5" />
                                        </span>
                                        <span>
                                            <span
                                                class="block text-sm font-semibold text-[var(--ca-text)]"
                                                >{{ t('contact.channels.whatsapp') }}</span
                                            >
                                            <span
                                                class="block text-xs text-[var(--ca-subtle)]"
                                                >{{ CONTACT.whatsappDisplay }}</span
                                            >
                                        </span>
                                    </span>
                                    <Icon
                                        name="lucide:arrow-up-right"
                                        class="h-4 w-4 text-[var(--ca-subtle)]"
                                    />
                                </a>

                                <a
                                    :href="LINKS.email"
                                    data-analytics-label="contact_sidebar_email"
                                    class="flex items-center justify-between rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-4 py-3 transition hover:border-amber-300/40 hover:bg-amber-300/10"
                                >
                                    <span class="flex items-center gap-3">
                                        <span class="ca-icon-gold inline-flex h-10 w-10 items-center justify-center rounded-lg">
                                            <Icon name="lucide:mail" class="h-5 w-5" />
                                        </span>
                                        <span>
                                            <span
                                                class="block text-sm font-semibold text-[var(--ca-text)]"
                                                >{{ t('contact.channels.email') }}</span
                                            >
                                            <span
                                                class="block text-xs text-[var(--ca-subtle)]"
                                                >{{ CONTACT.email }}</span
                                            >
                                        </span>
                                    </span>
                                    <Icon
                                        name="lucide:arrow-up-right"
                                        class="h-4 w-4 text-[var(--ca-subtle)]"
                                    />
                                </a>
                            </div>
                        </article>

                        <article class="ca-card-soft p-5 sm:p-6">
                            <h3
                                class="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]"
                            >
                                {{ t('contact.whatToPrepare.title') }}
                            </h3>
                            <ul class="mt-4 space-y-2 text-sm text-[var(--ca-muted)]">
                                <li
                                    v-for="item in (t('contact.whatToPrepare.items') as string[])"
                                    :key="item"
                                    class="flex items-start gap-2"
                                >
                                    <Icon
                                        name="lucide:check"
                                        class="mt-0.5 h-4 w-4 ca-tone-emerald"
                                    />
                                    {{ item }}
                                </li>
                            </ul>
                            <p class="mt-4 text-xs text-[var(--ca-subtle)]">
                                {{ t('contact.channels.businessHours') }}
                            </p>
                        </article>
                    </aside>

                    <article ref="contactForm" class="ca-card p-5 sm:p-6 lg:p-7">
                        <div class="mb-6">
                            <h2
                                class="text-2xl font-display font-bold text-[var(--ca-text)]"
                            >
                                {{ t('contact.form.title') }}
                            </h2>
                            <p class="mt-2 text-sm text-[var(--ca-muted)]">
                                {{ t('contact.form.subtitle') }}
                            </p>
                        </div>

                        <form class="space-y-5" @submit.prevent="handleSubmit">
                            <div class="grid gap-4 sm:grid-cols-2">
                                <BaseInput
                                    id="name"
                                    v-model.trim="form.name"
                                    :label="t('contact.form.fields.name') as string"
                                    required
                                    :disabled="formState.isSubmitting"
                                    :placeholder="t('contact.form.placeholders.name') as string"
                                />
                                <BaseInput
                                    id="email"
                                    v-model.trim="form.email"
                                    type="email"
                                    :label="t('contact.form.fields.email') as string"
                                    required
                                    :disabled="formState.isSubmitting"
                                    :placeholder="t('contact.form.placeholders.email') as string"
                                />
                            </div>

                            <div class="grid gap-4 sm:grid-cols-2">
                                <BaseInput
                                    id="phone"
                                    v-model="phoneModel"
                                    type="tel"
                                    :label="t('contact.form.fields.phone') as string"
                                    :disabled="formState.isSubmitting"
                                    :placeholder="t('contact.form.placeholders.phone') as string"
                                />

                                <SearchSelect
                                    id="subject"
                                    v-model="form.subject"
                                    :options="subjectOptions"
                                    :label="t('contact.form.fields.subject') as string"
                                    required
                                    :disabled="formState.isSubmitting"
                                    :placeholder="t('contact.form.placeholders.subject') as string"
                                />

                                <!-- Anggaran sengaja TIDAK wajib. Pada kampanye berbayar
                                     bervolume kecil, kolom wajib tambahan menukar lead nyata
                                     dengan kerapian data. Pilihan "Belum ada anggaran"
                                     disediakan supaya yang sedang riset tetap menjawab jujur
                                     alih-alih melewatinya. -->
                                <SearchSelect
                                    id="budget-range"
                                    v-model="form.budgetRange"
                                    :options="budgetOptions"
                                    :label="t('contact.form.fields.budgetRange') as string"
                                    :disabled="formState.isSubmitting"
                                    :placeholder="t('contact.form.placeholders.budgetRange') as string"
                                />
                            </div>

                            <BaseTextarea
                                id="message"
                                v-model.trim="form.message"
                                :label="t('contact.form.fields.message') as string"
                                required
                                :rows="5"
                                :disabled="formState.isSubmitting"
                                :placeholder="t('contact.form.placeholders.message') as string"
                            />

                            <BaseCheckbox
                                id="consent"
                                v-model="form.consent"
                                required
                                :disabled="formState.isSubmitting"
                            >
                                {{ t('contact.form.fields.consent') }}
                            </BaseCheckbox>

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
                                        ? t('contact.form.submitting')
                                        : t('contact.form.submit')
                                }}
                            </button>

                            <p
                                v-if="formState.isSuccess"
                                class="ca-status-success"
                                role="status"
                                aria-live="polite"
                            >
                                {{ t('contact.form.success') }}
                            </p>

                            <a
                                v-if="formState.isSuccess && formState.successWhatsAppUrl"
                                :href="formState.successWhatsAppUrl"
                                target="_blank"
                                rel="noopener noreferrer"
                                data-analytics-ignore="true"
                                class="ca-btn-secondary w-full"
                                @click="trackWhatsAppClick('contact_form_success')"
                            >
                                <Icon name="lucide:message-circle" class="h-4 w-4" />
                                {{ t('contact.form.whatsappContinue') }}
                            </a>

                            <p
                                v-if="formState.errorMessage"
                                class="ca-status-danger"
                                role="alert"
                            >
                                {{ formState.errorMessage }}
                            </p>

                            <a
                                v-if="formState.hasSubmissionError"
                                :href="whatsappFallbackUrl"
                                target="_blank"
                                rel="noopener noreferrer"
                                data-analytics-ignore="true"
                                class="ca-btn-secondary w-full"
                                @click="trackWhatsAppClick('contact_form_failure_fallback')"
                            >
                                <Icon name="lucide:message-circle" class="h-4 w-4" />
                                {{ t('contact.form.whatsappFallback') }}
                            </a>
                        </form>
                    </article>
                </div>
            </div>
        </section>
    </div>
</template>
