<script setup lang="ts">
import { useCoreI18n } from '~/composables/useCoreI18n'
import { useAnalytics } from '~/composables/useAnalytics'
import { useGatewayApi } from '~/composables/useGatewayApi'
import type { PricingPlan, RegisterPayload, RegistrationStatusResult } from '~/composables/useGatewayApi'
import { useDebounceFn } from '@vueuse/core'

const { locale, t } = useCoreI18n()
const { trackFormSubmit } = useAnalytics()
const { useReveal } = useScrollReveal()
const route = useRoute()
const { fetchPlans, checkSlug, register, getRegistrationStatus } = useGatewayApi()

const formSection = useReveal('slideLeft')
const summarySection = useReveal('slideRight', 150)

useCoreSeo({
    title: t('register.title') as string,
    description: t('register.description') as string,
    path: '/register',
})

useSchemaOrg([
    defineWebPage({
        name: t('register.schema.name') as string,
        description: t('register.schema.description') as string,
    }),
])

// ── Plan Data ──
const plans = ref<PricingPlan[]>([])
const selectedPlanId = ref<string>((route.query.plan as string) || '')

const selectedPlan = computed(() => {
    return plans.value.find(p => p.id === selectedPlanId.value)
        || plans.value.find(p => p.popular)
        || plans.value[0]
        || null
})

onMounted(async () => {
    plans.value = await fetchPlans()
    if (!selectedPlanId.value || !plans.value.some(plan => plan.id === selectedPlanId.value)) {
        selectedPlanId.value = plans.value.find(plan => plan.popular)?.id || plans.value[0]?.id || ''
    }

    const registrationId = typeof route.query.registration_id === 'string'
        ? route.query.registration_id
        : ''
    if (registrationId) {
        await syncRegistrationStatus(registrationId)
    }
})

// ── Organization Types ──
const orgTypes = computed(() => (t('register.orgTypes') as Array<{ value: string; label: string }>) || [])

// ── Form State ──
interface RegisterForm {
    orgName: string
    slug: string
    orgType: string
    fullName: string
    email: string
    phone: string
    password: string
    confirmPassword: string
    agree: boolean
}

const form = reactive<RegisterForm>({
    orgName: '',
    slug: '',
    orgType: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agree: false,
})

const formState = reactive({
    isSubmitting: false,
    isSuccess: false,
    errorMessage: '',
    successTitle: t('register.success.createdTitle') as string,
    successMessage: '',
})

const errors = reactive<Record<string, string>>({})

const paymentReturn = reactive({
    isChecking: false,
    status: '' as '' | RegistrationStatusResult['status'],
    message: '',
    invoiceUrl: '',
})

const trustSignals = computed(() => (t('register.summary.trustSignals') as string[]) || [])

const formatRegisterText = (key: string, replacements: Record<string, string> = {}) => {
    let text = t(key) as string

    Object.entries(replacements).forEach(([token, value]) => {
        text = text.replace(`{${token}}`, value)
    })

    return text
}

// ── Slug Checking ──
const slugState = reactive({
    isChecking: false,
    isAvailable: null as boolean | null,
    suggestion: '',
})

const slugRegex = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

const normalizeSlug = (value: string): string => {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/--+/g, '-')
        .slice(0, 30)
}

const debouncedSlugCheck = useDebounceFn(async (slug: string) => {
    if (!slug || slug.length < 3 || !slugRegex.test(slug)) {
        slugState.isAvailable = null
        slugState.isChecking = false
        return
    }

    slugState.isChecking = true
    try {
        const result = await checkSlug(slug)
        slugState.isAvailable = result.available
        slugState.suggestion = result.suggestion || ''
    } catch {
        slugState.isAvailable = null
    } finally {
        slugState.isChecking = false
    }
}, 300)

const slugModel = computed({
    get: () => form.slug,
    set: (val: string) => {
        form.slug = normalizeSlug(val)
        slugState.isAvailable = null
        if (form.slug.length >= 3) {
            debouncedSlugCheck(form.slug)
        }
    },
})

// ── Phone Handler (reused from contact page pattern) ──
const phoneModel = computed({
    get: () => form.phone,
    set: (val: string) => {
        if (!val) {
            form.phone = ''
            return
        }

        let raw = val.replace(/[^0-9+]/g, '')

        if ((raw.match(/\+/g) || []).length > 1) {
            raw = raw.replace(/\+/g, (match, offset) => offset === 0 ? '+' : '')
        }

        if (raw.startsWith('08')) {
            raw = '+62' + raw.slice(1)
        } else if (raw.startsWith('628')) {
            raw = '+' + raw
        } else if (raw.startsWith('8')) {
            raw = '+62' + raw
        }

        if (!raw.startsWith('+') && raw.length > 0) {
            raw = '+' + raw
        }

        let formatted = raw
        if (raw.startsWith('+62')) {
            const rest = raw.slice(3)
            const chunks = []
            if (rest.length > 0) chunks.push(rest.slice(0, 3))
            if (rest.length > 3) chunks.push(rest.slice(3, 7))
            if (rest.length > 7) chunks.push(rest.slice(7, 13))
            formatted = '+62 ' + chunks.join(' ')
        }

        form.phone = formatted.trim()
    },
})

// ── Password Strength ──
const passwordStrength = computed(() => {
    const pwd = form.password
    if (!pwd) return { level: 0, label: '', color: '' }

    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    const levels = [
        { level: 0, label: '', color: '' },
        { level: 1, label: t('register.passwordStrength.weak') as string, color: 'bg-rose-400' },
        { level: 2, label: t('register.passwordStrength.fair') as string, color: 'bg-amber-400' },
        { level: 3, label: t('register.passwordStrength.good') as string, color: 'bg-emerald-400' },
        { level: 4, label: t('register.passwordStrength.strong') as string, color: 'bg-emerald-300' },
    ]

    return levels[score] || levels[0]
})

// ── Auto-generate slug from org name ──
watch(() => form.orgName, (name) => {
    if (!form.slug || form.slug === normalizeSlug(form.orgName.replace(name, ''))) {
        const auto = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .slice(0, 30)
        form.slug = auto
        if (auto.length >= 3 && slugRegex.test(auto)) {
            debouncedSlugCheck(auto)
        }
    }
})

// ── Validation ──
const validate = (): boolean => {
    // Reset errors
    Object.keys(errors).forEach(key => delete errors[key])

    if (!form.orgName.trim()) {
        errors.orgName = t('register.validation.orgNameRequired') as string
    }

    if (!form.slug || form.slug.length < 3) {
        errors.slug = t('register.validation.slugMin') as string
    } else if (!slugRegex.test(form.slug)) {
        errors.slug = t('register.validation.slugFormat') as string
    } else if (slugState.isAvailable === false) {
        errors.slug = t('register.validation.slugUnavailable') as string
    }

    if (!form.orgType) {
        errors.orgType = t('register.validation.orgTypeRequired') as string
    }

    if (!form.fullName.trim()) {
        errors.fullName = t('register.validation.fullNameRequired') as string
    }

    if (!form.email.trim()) {
        errors.email = t('register.validation.emailRequired') as string
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = t('register.validation.emailInvalid') as string
    }

    if (!form.phone.trim()) {
        errors.phone = t('register.validation.phoneRequired') as string
    }

    if (!form.password) {
        errors.password = t('register.validation.passwordRequired') as string
    } else if (form.password.length < 8) {
        errors.password = t('register.validation.passwordMin') as string
    }

    if (!form.confirmPassword) {
        errors.confirmPassword = t('register.validation.confirmPasswordRequired') as string
    } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = t('register.validation.confirmPasswordMismatch') as string
    }

    if (!form.agree) {
        errors.agree = t('register.validation.agreeRequired') as string
    }

    return Object.keys(errors).length === 0
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const isSafeRedirect = (url: string): boolean => {
    try {
        const parsed = new URL(url)
        const allowed = ['coreasia.id', 'www.coreasia.id']
        return allowed.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))
    } catch {
        return false
    }
}

const safeRedirect = (url: string) => {
    if (isSafeRedirect(url)) {
        window.location.href = url
    }
}

const syncRegistrationStatus = async (registrationId: string) => {
    paymentReturn.isChecking = true
    paymentReturn.message = ''
    paymentReturn.invoiceUrl = ''

    try {
        let latestStatus: RegistrationStatusResult | null = null

        for (let attempt = 0; attempt < 8; attempt++) {
            latestStatus = await getRegistrationStatus(registrationId)
            if (!latestStatus) break

            paymentReturn.status = latestStatus.status
            paymentReturn.invoiceUrl = latestStatus.invoiceUrl || ''

            if (latestStatus.status === 'ready' && latestStatus.loginUrl && process.client) {
                safeRedirect(latestStatus.loginUrl)
                return
            }

            if (latestStatus.status !== 'provisioning') {
                break
            }

            await sleep(2500)
        }

        if (!latestStatus) {
            paymentReturn.message = t('register.payment.unavailable') as string
            return
        }

        if (latestStatus.status === 'provisioning') {
            paymentReturn.message = t('register.payment.provisioning') as string
            return
        }

        if (latestStatus.status === 'payment_failed') {
            paymentReturn.message = t('register.payment.failed') as string
            return
        }

        if (latestStatus.status === 'payment_review') {
            paymentReturn.message = t('register.payment.review') as string
            return
        }

        if (latestStatus.status === 'pending_payment') {
            paymentReturn.message = t('register.payment.pending') as string
        }
    } finally {
        paymentReturn.isChecking = false
    }
}

// ── Submit ──
const handleSubmit = async () => {
    if (!validate()) return

    formState.isSubmitting = true
    formState.errorMessage = ''

    try {
        const payload: RegisterPayload = {
            organization: {
                name: form.orgName,
                slug: form.slug,
                type: form.orgType,
            },
            admin: {
                fullName: form.fullName,
                email: form.email,
                phone: form.phone.replace(/\s+/g, ''),
                password: form.password,
            },
            plan: selectedPlanId.value,
        }

        const result = await register(payload)

        if (result.success) {
            if (result.redirectUrl && process.client) {
                safeRedirect(result.redirectUrl)
                return
            }

            formState.successTitle = result.status === 'ready'
                ? t('register.success.readyTitle') as string
                : t('register.success.createdTitle') as string
            formState.successMessage = result.message
            formState.isSuccess = true
            trackFormSubmit('registration', { plan: selectedPlanId.value, org_type: form.orgType })

            if (process.client) {
                try {
                    const confetti = (await import('canvas-confetti')).default
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        zIndex: 9999,
                    })
                } catch (e) {
                    console.error('Failed to load confetti:', e)
                }
            }
        } else {
            formState.errorMessage = result.message || (t('common.error') as string)
        }
    } catch {
        formState.errorMessage = locale.value === 'en'
            ? 'Connection failed. Please check your internet connection.'
            : 'Koneksi gagal. Periksa koneksi internet Anda.'
    } finally {
        formState.isSubmitting = false
    }
}
</script>

<template>
    <div>
        <!-- Hero Section -->
        <section class="relative overflow-hidden">
            <div class="pointer-events-none absolute inset-0">
                <div
                    class="absolute inset-0 bg-[radial-gradient(920px_420px_at_15%_0%,rgba(251,191,36,0.12),transparent_62%)]"
                />
                <div
                    class="absolute inset-0 bg-[radial-gradient(900px_440px_at_100%_10%,rgba(16,185,129,0.10),transparent_64%)]"
                />
            </div>

            <div class="ca-container relative ca-section pb-10 sm:pb-12 lg:pb-16">
                <NuxtLink
                    to="/pricing"
                    class="mb-6 inline-flex items-center gap-2 text-sm text-[var(--ca-muted)] transition hover:text-[var(--ca-text)]"
                >
                    <Icon name="lucide:arrow-left" class="h-4 w-4" />
                    {{ t('register.backToPricing') }}
                </NuxtLink>
                <span class="ca-kicker">
                    <Icon name="lucide:rocket" class="h-3.5 w-3.5 ca-tone-gold" />
                    {{ t('register.kicker') }}
                </span>
                <h1
                    class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-[var(--ca-text)] sm:text-5xl"
                    v-html="t('register.hero.title')"
                />
                <p class="ca-copy mt-4 max-w-2xl">
                    {{ t('register.hero.subtitle') }}
                </p>
            </div>
        </section>

        <!-- Success State -->
        <section v-if="formState.isSuccess" class="ca-section pt-0">
            <div class="ca-container">
                <div class="ca-card mx-auto max-w-2xl p-8 text-center sm:p-12">
                    <div class="ca-icon-emerald mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full">
                        <Icon name="lucide:check-circle-2" class="h-10 w-10" />
                    </div>
                    <h2 class="text-2xl font-display font-bold text-[var(--ca-text)] sm:text-3xl">
                        {{ formState.successTitle }}
                    </h2>
                    <p class="mt-3 text-[var(--ca-muted)]">
                        {{ formState.successMessage || formatRegisterText('register.success.defaultMessage', { orgName: form.orgName }) }}
                    </p>
                    <div class="mt-4 rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4">
                        <p class="text-sm text-[var(--ca-subtle)]">{{ t('register.success.subdomainLabel') }}</p>
                        <p class="mt-1 text-lg font-bold ca-tone-gold">
                            {{ form.slug }}.coreasia.id
                        </p>
                    </div>
                    <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <NuxtLink to="/" class="ca-btn-primary">
                            {{ t('register.success.backHome') }}
                            <Icon name="lucide:arrow-right" class="h-4 w-4" />
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>

        <!-- Registration Form + Plan Summary -->
        <section v-else class="ca-section pt-0">
            <div class="ca-container">
                <div
                    v-if="paymentReturn.message"
                    class="mb-6 rounded-2xl border px-5 py-4 text-sm"
                    :class="paymentReturn.status === 'payment_failed'
                        ? 'border-[color:var(--ca-danger-border)] bg-[var(--ca-danger-bg)] ca-tone-danger'
                        : 'border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] ca-tone-gold'"
                >
                    <div class="flex items-start gap-3">
                        <Icon
                            :name="paymentReturn.isChecking ? 'lucide:loader-2' : 'lucide:credit-card'"
                            class="mt-0.5 h-4 w-4 flex-shrink-0"
                            :class="paymentReturn.isChecking ? 'animate-spin' : ''"
                        />
                        <div class="space-y-3">
                            <p>{{ paymentReturn.message }}</p>
                            <a
                                v-if="paymentReturn.invoiceUrl"
                                :href="paymentReturn.invoiceUrl"
                                class="ca-pill-gold rounded-xl px-4 py-2 font-semibold transition hover:bg-[var(--ca-panel-bg-strong)]"
                            >
                                {{ t('register.payment.continuePayment') }}
                                <Icon name="lucide:arrow-right" class="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>

                <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                    <!-- Left: Registration Form -->
                    <article ref="formSection" class="ca-card p-5 sm:p-6 lg:p-7">
                        <form class="space-y-6" @submit.prevent="handleSubmit">

                            <!-- Section: Organization -->
                            <div>
                                <h2 class="flex items-center gap-2 text-lg font-display font-bold text-[var(--ca-text)]">
                                    <Icon name="lucide:building" class="h-5 w-5 ca-tone-gold" />
                                    {{ t('register.sections.organization') }}
                                </h2>
                                <div class="mt-1 h-px bg-[color:var(--ca-border)]" />
                            </div>

                            <BaseInput
                                id="orgName"
                                v-model.trim="form.orgName"
                                :label="t('register.fields.orgName') as string"
                                required
                                :disabled="formState.isSubmitting"
                                :placeholder="t('register.placeholders.orgName') as string"
                                :error="errors.orgName"
                            />

                            <div class="w-full">
                                <label for="slug" class="ca-field-label">
                                    {{ t('register.fields.slug') }} <span class="ca-required">*</span>
                                </label>
                                <div class="flex items-stretch">
                                    <div class="relative flex-1">
                                        <input
                                            id="slug"
                                            v-model="slugModel"
                                            type="text"
                                            :placeholder="t('register.placeholders.slug') as string"
                                            :disabled="formState.isSubmitting"
                                            class="w-full rounded-l-xl rounded-r-none border border-r-0 border-[color:var(--ca-border)] bg-[var(--ca-input-bg)] px-4 py-3 text-sm text-[var(--ca-text)] placeholder:text-[var(--ca-subtle)] transition-colors focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                                            :class="[
                                                errors.slug
                                                    ? 'border-rose-300/50 focus:border-rose-400'
                                                    : 'focus:border-amber-300/40',
                                            ]"
                                            maxlength="30"
                                        />
                                        <!-- Slug status indicator -->
                                        <div v-if="form.slug.length >= 3" class="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Icon
                                                v-if="slugState.isChecking"
                                                name="lucide:loader-2"
                                                class="h-4 w-4 animate-spin text-[var(--ca-subtle)]"
                                            />
                                            <Icon
                                                v-else-if="slugState.isAvailable === true"
                                                name="lucide:check-circle-2"
                                                class="h-4 w-4 ca-tone-emerald"
                                            />
                                            <Icon
                                                v-else-if="slugState.isAvailable === false"
                                                name="lucide:x-circle"
                                                class="h-4 w-4 ca-tone-danger"
                                            />
                                        </div>
                                    </div>
                                    <span
                                        class="inline-flex items-center rounded-r-xl border border-l-0 border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] px-3 text-sm text-[var(--ca-subtle)]"
                                    >
                                        {{ t('register.slug.suffix') }}
                                    </span>
                                </div>
                                <p v-if="errors.slug" class="mt-1 text-xs ca-field-error">
                                    {{ errors.slug }}
                                </p>
                                <p v-else-if="slugState.isAvailable === true && form.slug" class="mt-1 text-xs ca-field-success">
                                    {{ formatRegisterText('register.slug.available', { slug: form.slug }) }}
                                </p>
                                <p v-else-if="slugState.isAvailable === false && slugState.suggestion" class="mt-1 text-xs ca-field-error">
                                    {{ t('register.slug.usedSuggestion') }}
                                    <button type="button" class="ml-1 font-semibold underline" @click="slugModel = slugState.suggestion">{{ slugState.suggestion }}</button>
                                </p>
                                <p v-else class="mt-1 text-xs text-[var(--ca-subtle)]">
                                    {{ t('register.slug.helper') }}
                                </p>
                            </div>

                            <SearchSelect
                                id="orgType"
                                v-model="form.orgType"
                                :options="orgTypes"
                                :label="t('register.fields.orgType') as string"
                                required
                                :disabled="formState.isSubmitting"
                                :placeholder="t('register.placeholders.orgType') as string"
                                :error="errors.orgType"
                            />
                            <!-- Section: Admin Account -->
                            <div class="pt-2">
                                <h2 class="flex items-center gap-2 text-lg font-display font-bold text-[var(--ca-text)]">
                                    <Icon name="lucide:user-circle-2" class="h-5 w-5 ca-tone-gold" />
                                    {{ t('register.sections.admin') }}
                                </h2>
                                <div class="mt-1 h-px bg-[color:var(--ca-border)]" />
                            </div>

                            <BaseInput
                                id="fullName"
                                v-model.trim="form.fullName"
                                :label="t('register.fields.fullName') as string"
                                required
                                :disabled="formState.isSubmitting"
                                :placeholder="t('register.placeholders.fullName') as string"
                                :error="errors.fullName"
                            />

                            <div class="grid gap-4 sm:grid-cols-2">
                                <BaseInput
                                    id="email"
                                    v-model.trim="form.email"
                                    type="email"
                                    :label="t('register.fields.email') as string"
                                    required
                                    :disabled="formState.isSubmitting"
                                    :placeholder="t('register.placeholders.email') as string"
                                    :error="errors.email"
                                />
                                <BaseInput
                                    id="phone"
                                    v-model="phoneModel"
                                    type="tel"
                                    :label="t('register.fields.phone') as string"
                                    required
                                    :disabled="formState.isSubmitting"
                                    :placeholder="t('register.placeholders.phone') as string"
                                    :error="errors.phone"
                                />
                            </div>
                            <!-- Password -->
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div class="w-full">
                                    <BasePasswordInput
                                        id="password"
                                        v-model="form.password"
                                        :label="t('register.fields.password') as string"
                                        required
                                        :disabled="formState.isSubmitting"
                                        :placeholder="t('register.placeholders.password') as string"
                                        :error="errors.password"
                                    />
                                    <!-- Password strength bar -->
                                    <div v-if="form.password" class="mt-2 flex items-center gap-2">
                                        <div class="flex flex-1 gap-1">
                                            <div
                                                v-for="n in 4"
                                                :key="n"
                                                class="h-1 flex-1 rounded-full transition-colors"
                                                :class="n <= passwordStrength.level ? passwordStrength.color : 'bg-[var(--ca-panel-bg)]'"
                                            />
                                        </div>
                                        <span class="text-xs text-[var(--ca-subtle)]">{{ passwordStrength.label }}</span>
                                    </div>
                                </div>

                                <div class="w-full">
                                    <BasePasswordInput
                                        id="confirmPassword"
                                        v-model="form.confirmPassword"
                                        :label="t('register.fields.confirmPassword') as string"
                                        required
                                        :disabled="formState.isSubmitting"
                                        :placeholder="t('register.placeholders.confirmPassword') as string"
                                        :error="errors.confirmPassword"
                                    />
                                    <p
                                        v-if="form.confirmPassword && form.password === form.confirmPassword"
                                        class="mt-1 text-xs ca-field-success"
                                    >
                                        <Icon name="lucide:check" class="mr-0.5 inline h-3 w-3" />
                                        {{ t('register.passwordStrength.matched') }}
                                    </p>
                                </div>
                            </div>
                            <!-- Terms Consent -->
                            <BaseCheckbox
                                id="agree"
                                v-model="form.agree"
                                :disabled="formState.isSubmitting"
                                :error="errors.agree"
                            >
                                {{ t('register.consent.prefix') }}
                                <NuxtLink to="/terms" target="_blank" class="font-semibold ca-link-accent" @click.stop>{{ t('register.consent.terms') }}</NuxtLink>
                                {{ t('register.consent.and') }}
                                <NuxtLink to="/privacy-policy" target="_blank" class="font-semibold ca-link-accent" @click.stop>{{ t('register.consent.privacy') }}</NuxtLink>
                            </BaseCheckbox>

                            <!-- Submit -->
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
                                    name="lucide:rocket"
                                    class="h-4 w-4"
                                />
                                {{ formState.isSubmitting ? t('register.submit.loading') : t('register.submit.idle') }}
                            </button>

                            <!-- Error Message -->
                            <p
                                v-if="formState.errorMessage"
                                class="ca-status-danger"
                                role="alert"
                            >
                                {{ formState.errorMessage }}
                            </p>
                        </form>
                    </article>

                    <!-- Right: Plan Summary -->
                    <aside ref="summarySection" class="space-y-4 lg:sticky lg:top-24">
                        <article v-if="selectedPlan" class="ca-card p-5 sm:p-6">
                            <div class="mb-4 flex items-center justify-between">
                                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
                                    {{ t('register.summary.selectedPlan') }}
                                </p>
                                <NuxtLink
                                    to="/pricing"
                                    class="inline-flex items-center gap-1 text-xs font-semibold ca-tone-gold transition hover:opacity-80"
                                >
                                    <Icon name="lucide:repeat-2" class="h-3.5 w-3.5" />
                                    {{ t('register.summary.changePlan') }}
                                </NuxtLink>
                            </div>

                            <h3 class="text-xl font-display font-bold text-[var(--ca-text)]">
                                {{ selectedPlan.name }}
                            </h3>
                            <div class="mt-2 flex items-baseline gap-1">
                                <span class="font-display text-3xl font-bold ca-tone-gold">
                                    {{ selectedPlan.priceLabel }}
                                </span>
                                <span class="text-sm text-[var(--ca-subtle)]">{{ selectedPlan.period }}</span>
                            </div>
                            <!-- Plan badge -->
                            <span
                                v-if="selectedPlan.badge"
                                class="ca-pill-gold mt-3"
                            >
                                <Icon name="lucide:sparkles" class="h-3 w-3" />
                                {{ selectedPlan.badge }}
                            </span>

                            <div class="my-4 h-px bg-[color:var(--ca-border)]" />

                            <!-- Features -->
                            <ul class="space-y-2.5">
                                <li
                                    v-for="feature in selectedPlan.features"
                                    :key="feature.label"
                                    class="flex items-center gap-2.5 text-sm"
                                >
                                    <Icon
                                        v-if="feature.included"
                                        name="lucide:check"
                                        class="h-4 w-4 flex-shrink-0 ca-tone-emerald"
                                    />
                                    <Icon
                                        v-else
                                        name="lucide:minus"
                                        class="h-4 w-4 flex-shrink-0 text-[var(--ca-subtle)]"
                                    />
                                    <span :class="feature.included ? 'text-[var(--ca-muted)]' : 'text-[var(--ca-subtle)]'">
                                        {{ feature.label }}
                                    </span>
                                </li>
                            </ul>
                        </article>

                        <!-- Plan switcher pills -->
                        <article class="ca-card-soft p-4">
                            <p class="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ca-subtle)]">
                                {{ t('register.summary.chooseOther') }}
                            </p>
                            <div class="flex gap-2">
                                <button
                                    v-for="plan in plans"
                                    :key="plan.id"
                                    type="button"
                                    class="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-all"
                                    :class="[
                                        plan.id === selectedPlanId
                                            ? 'border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] ca-tone-gold'
                                            : 'border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] text-[var(--ca-subtle)] hover:border-amber-300/20 hover:text-[var(--ca-text)]',
                                    ]"
                                    @click="selectedPlanId = plan.id"
                                >
                                    {{ plan.name }}
                                </button>
                            </div>
                        </article>

                        <!-- Trust signals -->
                        <article class="ca-card-soft p-4">
                            <ul class="space-y-2 text-sm text-[var(--ca-muted)]">
                                <li
                                    v-for="signal in trustSignals"
                                    :key="signal"
                                    class="flex items-start gap-2"
                                >
                                    <Icon name="lucide:shield-check" class="mt-0.5 h-4 w-4 flex-shrink-0 ca-tone-emerald" />
                                    {{ signal }}
                                </li>
                            </ul>
                        </article>
                    </aside>
                </div>
            </div>
        </section>
    </div>
</template>
