<script setup lang="ts">
import { LINKS, CONTACT, COMPANY, buildWhatsAppUrl } from '~/utils/constants'
import { briefCopy } from '~/utils/brief-copy'
import { briefContact, briefWhatsAppMessage, validateBriefStep, type ProjectBrief } from '~/utils/contact-brief'
import { submitContactBrief } from '~/services/contact-brief'

const { useReveal } = useScrollReveal()
const { t, locale } = useCoreI18n()
const copy = computed(() => briefCopy[locale.value === 'en' ? 'en' : 'id'])
const { trackFormStart, trackLeadSaved, trackWhatsAppClick } = useAnalytics()
const { getAttribution } = useLeadAttribution()
const { trackLeadConversion } = useGoogleAdsConversion()
const route = useRoute()
const config = useRuntimeConfig()
const publicApiBase = (import.meta.client ? config.public.gatewayPublicUrl : config.public.gatewayUrl) as string
const heroKicker = useReveal('fadeUp', 0)
const heroTitle = useReveal('fadeUp', 100)
const heroCopy = useReveal('fadeUp', 200)
const contactSidebar = useReveal('slideLeft')
const contactForm = useReveal('slideRight', 100)
const subjectOptions = computed(() =>
    Object.entries(t('contact.form.subjects') as Record<string, string>).map(([value, label]) => ({ value, label })),
)
const budgetOptions = computed(() =>
    Object.entries(t('contact.form.budgetRanges') as Record<string, string>).map(([value, label]) => ({
        value,
        label,
    })),
)
const timelineOptions = computed(() => Object.entries(copy.value.timelines).map(([value, label]) => ({ value, label })))
const projectSubjects = ['website', 'webapp', 'improve']
const initialSubject = () => {
    const raw = Array.isArray(route.query.subject) ? route.query.subject[0] : route.query.subject
    return typeof raw === 'string' && subjectOptions.value.some((o) => o.value === raw) ? raw : 'website'
}
const form = reactive<ProjectBrief>({
    name: '',
    email: '',
    phone: '',
    subject: initialSubject(),
    budgetRange: '',
    timeline: 'not_set',
    organization: '',
    preferredContact: 'whatsapp',
    message: '',
    consent: false,
})
const step = ref<1 | 2>(1)
const showOtherTopics = ref(!projectSubjects.includes(form.subject))
const fieldError = ref('')
const requestId = ref('')
const formState = reactive({
    isSubmitting: false,
    isSuccess: false,
    hasSubmissionError: false,
    successWhatsAppUrl: '',
    reference: '',
    errorMessage: '',
})
const selectedPlan = computed(() => (typeof route.query.plan === 'string' ? route.query.plan.slice(0, 200) : ''))
watch(selectedPlan, () => {
    requestId.value = ''
})
const hasTrackedFormStart = ref(false)
watch(
    form,
    () => {
        requestId.value = ''
        fieldError.value = ''
        formState.errorMessage = ''
    },
    { deep: true, flush: 'sync' },
)
watch(
    () => [form.name, form.email, form.phone, form.message],
    (values) => {
        if (!hasTrackedFormStart.value && values.some((v) => v.trim())) {
            hasTrackedFormStart.value = true
            trackFormStart('contact_brief', { subject: form.subject, plan: selectedPlan.value || undefined })
        }
    },
)
watch(
    () => route.query.subject,
    () => {
        if (!hasTrackedFormStart.value) {
            form.subject = initialSubject()
            showOtherTopics.value = !projectSubjects.includes(form.subject)
        }
    },
)
const messageForWhatsApp = (reference = '') =>
    briefWhatsAppMessage(form, {
        intro: copy.value.waIntro,
        subject: subjectOptions.value.find((o) => o.value === form.subject)?.label || form.subject,
        budget: budgetOptions.value.find((o) => o.value === form.budgetRange)?.label || '',
        timeline: timelineOptions.value.find((o) => o.value === form.timeline)?.label || '',
        plan: selectedPlan.value,
        reference,
        locale: locale.value,
    })
const whatsappFallbackUrl = computed(() => buildWhatsAppUrl(messageForWhatsApp()))
const errorFor = (field: string) =>
    fieldError.value === field ? copy.value.errors[field as keyof typeof copy.value.errors] : undefined
const focusField = (id: string) => nextTick(() => document.getElementById(id)?.focus())
const validateStep = (number: 1 | 2) => {
    fieldError.value = validateBriefStep(form, number) || ''
    if (fieldError.value) {
        focusField(fieldError.value === 'phone' ? 'phone' : fieldError.value)
        return false
    }
    return true
}
const advance = () => {
    if (validateStep(1)) {
        step.value = 2
        focusField('name')
    }
}
const back = () => {
    step.value = 1
    fieldError.value = ''
    focusField('message')
}
const toggleTopics = () => {
    showOtherTopics.value = !showOtherTopics.value
    form.subject = showOtherTopics.value ? 'support' : 'website'
}
const resetForm = () => {
    Object.assign(form, {
        name: '',
        email: '',
        phone: '',
        subject: initialSubject(),
        budgetRange: '',
        timeline: 'not_set',
        organization: '',
        preferredContact: 'whatsapp',
        message: '',
        consent: false,
    })
    step.value = 1
    showOtherTopics.value = !projectSubjects.includes(form.subject)
    hasTrackedFormStart.value = false
    requestId.value = ''
}
const startNewBrief = () => {
    formState.isSuccess = false
    formState.successWhatsAppUrl = ''
    formState.reference = ''
    resetForm()
}
const handleSubmit = async () => {
    if (formState.isSubmitting) return
    if (step.value === 1) {
        advance()
        return
    }
    if (!validateStep(1)) {
        step.value = 1
        return
    }
    if (!validateStep(2)) return
    formState.isSubmitting = true
    formState.errorMessage = ''
    formState.hasSubmissionError = false
    const contact = briefContact(form)
    const subject = form.subject
    try {
        if (!requestId.value) requestId.value = crypto.randomUUID()
        const attribution = getAttribution()
        const response = await submitContactBrief(publicApiBase, {
            request_id: requestId.value,
            name: form.name.trim(),
            ...contact,
            preferred_contact: form.preferredContact,
            subject: form.subject,
            message: form.message.trim(),
            consent: form.consent,
            budget_range: form.budgetRange || undefined,
            timeline: form.timeline,
            organization: form.organization.trim(),
            selected_plan: selectedPlan.value,
            utm_source: attribution?.utm_source || '',
            utm_medium: attribution?.utm_medium || '',
            utm_campaign: attribution?.utm_campaign || '',
            utm_content: attribution?.utm_content || '',
            utm_term: attribution?.utm_term || '',
            gclid: attribution?.gclid || '',
            fbclid: attribution?.fbclid || '',
            landing_page: attribution?.landing_page || window.location.origin + route.path,
            referrer: attribution?.referrer || '',
        })
        if (!response.success || !response.lead_id || !response.reference)
            throw new Error('Invalid saved brief response')
        formState.successWhatsAppUrl = buildWhatsAppUrl(messageForWhatsApp(response.reference))
        formState.reference = response.reference
        formState.isSuccess = true
        resetForm()
        try {
            trackLeadSaved(response.lead_id, 'contact_brief', { subject, plan: selectedPlan.value || undefined })
            trackLeadConversion(response.lead_id)
        } catch {
            /* Saved brief remains successful if analytics is blocked. */
        }
        void nextTick().then(() => {
            requestAnimationFrame(() => requestAnimationFrame(() =>
                contactForm.value?.scrollIntoView({
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                    block: 'center',
                }),
            ))
        })
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            void import('canvas-confetti')
                .then(({ default: confetti }) => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }))
                .catch(() => {})
        }
    } catch {
        formState.errorMessage = copy.value.unavailable
        formState.hasSubmissionError = true
    } finally {
        formState.isSubmitting = false
    }
}
useCoreSeo({
    title: t('contact.title') as string,
    description: t('contact.description') as string,
    path: '/contact',
    image: '/social/linkedin-share.webp',
    // Kartu LinkedIn kami 1200x627 dan benar-benar WebP, beda dari bawaan
    // 1200x630 PNG. Deklarasi harus ikut berkasnya, bukan sebaliknya.
    ogImageWidth: 1200,
    ogImageHeight: 627,
    ogImageType: 'image/webp',
    twitterImage: '/social/twitter-card.webp',
})

useSchemaOrg([
    defineWebPage({
        '@type': 'ContactPage',
        name: t('contact.schema.name') as string,
        description: t('contact.schema.description') as string,
        url: `${COMPANY.url}/contact`,
    }),
])
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

            <div class="ca-container relative ca-section pt-6 sm:pt-8 pb-10 sm:pb-12 lg:pb-16">
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
                    <aside ref="contactSidebar" class="order-2 space-y-4 lg:order-1">
                        <article class="ca-card p-5 sm:p-6">
                            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
                                {{ t('contact.channels.quickResponse') }}
                            </p>
                            <h2 class="mt-2 text-xl font-display font-bold text-[var(--ca-text)]">
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
                                        <span
                                            class="ca-icon-emerald inline-flex h-10 w-10 items-center justify-center rounded-lg"
                                        >
                                            <Icon name="lucide:message-circle" class="h-5 w-5" />
                                        </span>
                                        <span>
                                            <span class="block text-sm font-semibold text-[var(--ca-text)]">
                                                {{ t('contact.channels.whatsapp') }}
                                            </span>
                                            <span class="block text-xs text-[var(--ca-subtle)]">
                                                {{ CONTACT.whatsappDisplay }}
                                            </span>
                                        </span>
                                    </span>
                                    <Icon name="lucide:arrow-up-right" class="h-4 w-4 text-[var(--ca-subtle)]" />
                                </a>

                                <a
                                    :href="LINKS.email"
                                    data-analytics-label="contact_sidebar_email"
                                    class="flex items-center justify-between rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-4 py-3 transition hover:border-amber-300/40 hover:bg-amber-300/10"
                                >
                                    <span class="flex items-center gap-3">
                                        <span
                                            class="ca-icon-gold inline-flex h-10 w-10 items-center justify-center rounded-lg"
                                        >
                                            <Icon name="lucide:mail" class="h-5 w-5" />
                                        </span>
                                        <span>
                                            <span class="block text-sm font-semibold text-[var(--ca-text)]">
                                                {{ t('contact.channels.email') }}
                                            </span>
                                            <span class="block text-xs text-[var(--ca-subtle)]">
                                                {{ CONTACT.email }}
                                            </span>
                                        </span>
                                    </span>
                                    <Icon name="lucide:arrow-up-right" class="h-4 w-4 text-[var(--ca-subtle)]" />
                                </a>
                            </div>
                        </article>

                        <article class="ca-card-soft p-5 sm:p-6">
                            <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
                                {{ t('contact.whatToPrepare.title') }}
                            </h3>
                            <ul class="mt-4 space-y-2 text-sm text-[var(--ca-muted)]">
                                <li
                                    v-for="item in t('contact.whatToPrepare.items') as string[]"
                                    :key="item"
                                    class="flex items-start gap-2"
                                >
                                    <Icon name="lucide:check" class="mt-0.5 h-4 w-4 ca-tone-emerald" />
                                    {{ item }}
                                </li>
                            </ul>
                            <p class="mt-4 text-xs text-[var(--ca-subtle)]">
                                {{ t('contact.channels.businessHours') }}
                            </p>
                        </article>
                    </aside>

                    <article ref="contactForm" class="ca-card order-1 p-5 sm:p-6 lg:order-2 lg:p-7">
                        <!--
                            Saat berhasil, panel konfirmasi menggantikan SELURUH isi
                            kartu, bukan menempel di bawah tombol kirim. Tombol kirim
                            biasanya sudah menyentuh batas bawah layar, sehingga pesan
                            yang lahir di bawahnya tidak pernah terlihat. Ditambah
                            formulir yang dikosongkan pada saat yang sama, layar justru
                            terbaca sebagai pengiriman yang gagal.
                        -->
                        <div
                            v-if="formState.isSuccess"
                            class="flex flex-col items-center py-6 text-center sm:py-10"
                            role="status"
                            aria-live="polite"
                        >
                            <span
                                class="flex h-14 w-14 items-center justify-center rounded-full"
                                :style="{ background: 'var(--ca-emerald-bg)', color: 'var(--ca-emerald-text)' }"
                            >
                                <Icon name="lucide:check" class="h-7 w-7" />
                            </span>

                            <h2 class="mt-5 text-2xl font-display font-bold text-[var(--ca-text)]">
                                {{ copy.success }}
                            </h2>
                            <p class="mt-3 max-w-md text-sm leading-relaxed text-[var(--ca-muted)]">
                                {{ copy.successBody }}
                            </p>
                            <p class="mt-4 text-sm text-[var(--ca-muted)]">
                                {{ copy.reference }}:
                                <strong class="break-all text-[var(--ca-text)]">{{ formState.reference }}</strong>
                            </p>
                            <p class="mt-3 max-w-md text-sm text-[var(--ca-muted)]">{{ copy.nextSteps }}</p>

                            <a
                                v-if="formState.successWhatsAppUrl"
                                :href="formState.successWhatsAppUrl"
                                target="_blank"
                                rel="noopener noreferrer"
                                data-analytics-ignore="true"
                                class="ca-btn-primary mt-7 w-full sm:w-auto"
                                @click="trackWhatsAppClick('contact_form_success')"
                            >
                                <Icon name="lucide:message-circle" class="h-4 w-4" />
                                {{ t('contact.form.whatsappContinue') }}
                            </a>

                            <button
                                type="button"
                                class="mt-4 text-sm font-medium text-[var(--ca-muted)] underline underline-offset-4 transition-colors hover:text-[var(--ca-text)]"
                                @click="startNewBrief"
                            >
                                {{ t('contact.form.sendAnother') }}
                            </button>
                        </div>

                        <template v-else>
                            <div class="mb-6">
                                <h2 class="text-2xl font-display font-bold text-[var(--ca-text)]">
                                    {{ step === 1 ? copy.title : copy.contactTitle }}
                                </h2>
                                <p class="mt-2 text-sm text-[var(--ca-muted)]">
                                    {{ copy.subtitle }}
                                </p>
                            </div>

                            <form
                                class="space-y-5"
                                novalidate
                                :aria-busy="formState.isSubmitting"
                                @submit.prevent="handleSubmit"
                            >
                                <p class="text-sm font-medium" aria-live="polite">
                                    {{ copy.step }} {{ step }} {{ copy.of }} 2
                                </p>
                                <div class="flex gap-2" aria-hidden="true">
                                    <span class="h-1 flex-1 rounded-full bg-amber-500" />
                                    <span
                                        class="h-1 flex-1 rounded-full"
                                        :class="step === 2 ? 'bg-amber-500' : 'bg-[var(--ca-border)]'"
                                    />
                                </div>
                                <fieldset v-if="step === 1" class="space-y-5" :disabled="formState.isSubmitting">
                                    <legend class="sr-only">{{ copy.project }}</legend>
                                    <div
                                        v-if="!showOtherTopics"
                                        class="grid gap-3 sm:grid-cols-3"
                                        role="radiogroup"
                                        :aria-label="copy.project"
                                    >
                                        <label
                                            v-for="value in projectSubjects"
                                            :key="value"
                                            class="relative flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium focus-within:ring-2 focus-within:ring-amber-500"
                                            :class="
                                                form.subject === value
                                                    ? 'border-amber-500 bg-[var(--ca-kicker-bg)]'
                                                    : 'border-[var(--ca-border)]'
                                            "
                                        >
                                            <input
                                                v-model="form.subject"
                                                type="radio"
                                                name="project"
                                                :value="value"
                                                class="accent-amber-600"
                                            >
                                            {{ copy[value as 'website' | 'webapp' | 'improve'] }}
                                        </label>
                                    </div>
                                    <SearchSelect
                                        v-else
                                        id="subject"
                                        v-model="form.subject"
                                        :options="subjectOptions"
                                        :label="t('contact.form.fields.subject') as string"
                                        :error="errorFor('subject')"
                                    />
                                    <button
                                        type="button"
                                        class="text-left text-sm underline underline-offset-4 text-[var(--ca-muted)]"
                                        @click="toggleTopics"
                                    >
                                        {{ showOtherTopics ? copy.projects : copy.other }}
                                    </button>
                                    <BaseTextarea
                                        id="message"
                                        v-model="form.message"
                                        :label="copy.goal"
                                        :placeholder="copy.goalHint"
                                        :error="errorFor('message')"
                                        :rows="4"
                                        maxlength="5000"
                                        required
                                    />
                                    <div class="grid gap-5 sm:grid-cols-2">
                                        <SearchSelect
                                            id="timeline"
                                            v-model="form.timeline"
                                            :options="timelineOptions"
                                            :label="copy.timeline"
                                        />
                                        <SearchSelect
                                            id="budget-range"
                                            v-model="form.budgetRange"
                                            :options="budgetOptions"
                                            :label="t('contact.form.fields.budgetRange') as string"
                                            :placeholder="t('contact.form.placeholders.budgetRange') as string"
                                        />
                                    </div>
                                    <div class="flex flex-wrap items-center justify-between gap-3">
                                        <p class="text-xs text-[var(--ca-muted)]">{{ copy.noCommitment }}</p>
                                        <button type="submit" class="ca-btn-primary">
                                            {{ copy.next }}
                                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                                        </button>
                                    </div>
                                </fieldset>
                                <fieldset v-else class="space-y-5" :disabled="formState.isSubmitting">
                                    <legend class="sr-only">
                                        {{ copy.contactTitle }}
                                    </legend>
                                    <BaseInput
                                        id="name"
                                        v-model="form.name"
                                        :label="t('contact.form.fields.name') as string"
                                        :error="errorFor('name')"
                                        maxlength="200"
                                        autocomplete="name"
                                        required
                                    />
                                    <div>
                                        <label for="preferred-contact" class="ca-field-label">
                                            {{ copy.contactMethod }}
                                        </label>
                                        <select
                                            id="preferred-contact"
                                            v-model="form.preferredContact"
                                            class="ca-field-control"
                                        >
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="email">Email</option>
                                        </select>
                                    </div>
                                    <BaseInput
                                        v-if="form.preferredContact === 'whatsapp'"
                                        id="phone"
                                        v-model="form.phone"
                                        type="tel"
                                        :label="t('contact.form.fields.phone') as string"
                                        :error="errorFor('phone')"
                                        placeholder="08… / +62…"
                                        maxlength="32"
                                        autocomplete="tel"
                                        required
                                    />
                                    <BaseInput
                                        v-else
                                        id="email"
                                        v-model="form.email"
                                        type="email"
                                        :label="t('contact.form.fields.email') as string"
                                        :error="errorFor('email')"
                                        maxlength="254"
                                        autocomplete="email"
                                        required
                                    />
                                    <BaseInput
                                        id="organization"
                                        v-model="form.organization"
                                        :label="copy.organization"
                                        :error="errorFor('organization')"
                                        maxlength="300"
                                        autocomplete="organization"
                                    />
                                    <BaseCheckbox
                                        id="consent"
                                        v-model="form.consent"
                                        :disabled="formState.isSubmitting"
                                        :error="errorFor('consent')"
                                        required
                                    >
                                        {{ t('contact.form.fields.consent') }}
                                    </BaseCheckbox>
                                    <p class="text-xs text-[var(--ca-muted)]">
                                        {{ t('contact.channels.businessHours') }}.
                                        <NuxtLink to="/privacy-policy" class="underline underline-offset-4">
                                            {{ locale === 'en' ? 'Privacy policy' : 'Kebijakan privasi' }}
                                        </NuxtLink>
                                    </p>
                                    <div class="flex flex-wrap items-center justify-between gap-3">
                                        <button type="button" class="ca-btn-secondary" @click="back">
                                            {{ copy.back }}
                                        </button>
                                        <button
                                            type="submit"
                                            class="ca-btn-primary disabled:opacity-70"
                                            :disabled="formState.isSubmitting"
                                        >
                                            <Icon
                                                :name="formState.isSubmitting ? 'lucide:loader-2' : 'lucide:send'"
                                                class="h-4 w-4"
                                                :class="{ 'animate-spin': formState.isSubmitting }"
                                            />
                                            {{ formState.isSubmitting ? copy.submitting : copy.submit }}
                                        </button>
                                    </div>
                                </fieldset>
                                <p v-if="formState.errorMessage" class="ca-status-danger" role="alert">
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
                                    {{ t('contact.form.whatsappFallback') }}
                                </a>
                            </form>
                        </template>
                    </article>
                </div>
            </div>
        </section>
    </div>
</template>
