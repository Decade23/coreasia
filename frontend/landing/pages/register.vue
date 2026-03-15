<script setup lang="ts">
import { useCoreI18n } from '~/composables/useCoreI18n'
import { useGatewayApi } from '~/composables/useGatewayApi'
import type { PricingPlan, RegisterPayload, RegistrationStatusResult } from '~/composables/useGatewayApi'
import { useDebounceFn } from '@vueuse/core'

const { t } = useCoreI18n()
const { useReveal } = useScrollReveal()
const route = useRoute()
const { fetchPlans, checkSlug, register, getRegistrationStatus } = useGatewayApi()

const formSection = useReveal('slideLeft')
const summarySection = useReveal('slideRight', 150)

useCoreSeo({
    title: 'Daftar Akun Baru',
    description: 'Buat akun CoreAsia LMS untuk organisasi Anda. Mulai dengan 14 hari trial gratis.',
    path: '/register',
})

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
const orgTypes = [
    { value: 'lsp', label: 'LSP (Lembaga Sertifikasi Profesi)' },
    { value: 'training_center', label: 'LPK / Training Center' },
    { value: 'corporate', label: 'Korporat' },
]

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
    successTitle: 'Pendaftaran Berhasil!',
    successMessage: '',
})

const errors = reactive<Record<string, string>>({})

const paymentReturn = reactive({
    isChecking: false,
    status: '' as '' | RegistrationStatusResult['status'],
    message: '',
    invoiceUrl: '',
})

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

// ── Password Visibility ──
const showPassword = ref(false)
const showConfirmPassword = ref(false)

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
        { level: 1, label: 'Lemah', color: 'bg-rose-400' },
        { level: 2, label: 'Cukup', color: 'bg-amber-400' },
        { level: 3, label: 'Baik', color: 'bg-emerald-400' },
        { level: 4, label: 'Kuat', color: 'bg-emerald-300' },
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
        errors.orgName = 'Nama organisasi wajib diisi'
    }

    if (!form.slug || form.slug.length < 3) {
        errors.slug = 'Subdomain minimal 3 karakter'
    } else if (!slugRegex.test(form.slug)) {
        errors.slug = 'Hanya huruf kecil, angka, dan dash. Tidak boleh diawali/diakhiri dash.'
    } else if (slugState.isAvailable === false) {
        errors.slug = 'Subdomain sudah digunakan'
    }

    if (!form.orgType) {
        errors.orgType = 'Pilih tipe organisasi'
    }

    if (!form.fullName.trim()) {
        errors.fullName = 'Nama lengkap wajib diisi'
    }

    if (!form.email.trim()) {
        errors.email = 'Email wajib diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Format email tidak valid'
    }

    if (!form.phone.trim()) {
        errors.phone = 'Nomor handphone wajib diisi'
    }

    if (!form.password) {
        errors.password = 'Password wajib diisi'
    } else if (form.password.length < 8) {
        errors.password = 'Password minimal 8 karakter'
    }

    if (!form.confirmPassword) {
        errors.confirmPassword = 'Konfirmasi password wajib diisi'
    } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'Password tidak cocok'
    }

    if (!form.agree) {
        errors.agree = 'Anda harus menyetujui Syarat & Ketentuan'
    }

    return Object.keys(errors).length === 0
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
                window.location.href = latestStatus.loginUrl
                return
            }

            if (latestStatus.status !== 'provisioning') {
                break
            }

            await sleep(2500)
        }

        if (!latestStatus) {
            paymentReturn.message = 'Status pembayaran belum dapat dimuat. Silakan refresh halaman atau hubungi tim kami.'
            return
        }

        if (latestStatus.status === 'provisioning') {
            paymentReturn.message = 'Pembayaran berhasil diterima. Workspace Anda sedang dipersiapkan dan halaman ini akan memperbarui otomatis.'
            return
        }

        if (latestStatus.status === 'payment_failed') {
            paymentReturn.message = 'Pembayaran belum berhasil diproses. Anda bisa melanjutkan pembayaran kembali dari link checkout.'
            return
        }

        if (latestStatus.status === 'payment_review') {
            paymentReturn.message = 'Pembayaran Anda sedang direview oleh payment gateway. Mohon tunggu beberapa saat.'
            return
        }

        if (latestStatus.status === 'pending_payment') {
            paymentReturn.message = 'Pendaftaran sudah tercatat. Silakan lanjutkan pembayaran untuk mengaktifkan workspace Anda.'
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
                window.location.href = result.redirectUrl
                return
            }

            formState.successTitle = result.status === 'ready'
                ? 'Workspace Berhasil Dibuat!'
                : 'Pendaftaran Berhasil!'
            formState.successMessage = result.message
            formState.isSuccess = true

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
            formState.errorMessage = result.message || 'Terjadi kesalahan. Silakan coba lagi.'
        }
    } catch {
        formState.errorMessage = 'Koneksi gagal. Periksa koneksi internet Anda.'
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
                    class="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                >
                    <Icon name="lucide:arrow-left" class="h-4 w-4" />
                    Kembali ke Pricing
                </NuxtLink>

                <span class="ca-kicker">
                    <Icon name="lucide:rocket" class="h-3.5 w-3.5 text-amber-300" />
                    Registrasi
                </span>
                <h1 class="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl">
                    Buat Akun <span class="ca-gradient-text">Organisasi Baru</span>
                </h1>
                <p class="ca-copy mt-4 max-w-2xl">
                    Setup hanya 5 menit. Langsung aktif tanpa proses manual.
                </p>
            </div>
        </section>

        <!-- Success State -->
        <section v-if="formState.isSuccess" class="ca-section pt-0">
            <div class="ca-container">
                <div class="ca-card mx-auto max-w-2xl p-8 text-center sm:p-12">
                    <div class="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15">
                        <Icon name="lucide:check-circle-2" class="h-10 w-10 text-emerald-300" />
                    </div>
                    <h2 class="text-2xl font-display font-bold text-white sm:text-3xl">
                        {{ formState.successTitle }}
                    </h2>
                    <p class="mt-3 text-slate-300">
                        {{ formState.successMessage || `Akun organisasi ${form.orgName} telah dibuat.` }}
                    </p>
                    <div class="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p class="text-sm text-slate-400">URL Subdomain Anda:</p>
                        <p class="mt-1 text-lg font-bold text-amber-200">
                            {{ form.slug }}.coreasia.id
                        </p>
                    </div>
                    <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <NuxtLink to="/" class="ca-btn-primary">
                            Kembali ke Beranda
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
                        ? 'border-rose-300/35 bg-rose-300/10 text-rose-100'
                        : 'border-amber-300/30 bg-amber-300/10 text-amber-100'"
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
                                class="inline-flex items-center gap-2 rounded-xl border border-amber-300/35 bg-amber-300/15 px-4 py-2 font-semibold text-amber-100 transition hover:bg-amber-300/20"
                            >
                                Lanjutkan Pembayaran
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
                                <h2 class="flex items-center gap-2 text-lg font-display font-bold text-white">
                                    <Icon name="lucide:building" class="h-5 w-5 text-amber-300" />
                                    Data Organisasi
                                </h2>
                                <div class="mt-1 h-px bg-white/10" />
                            </div>

                            <BaseInput
                                id="orgName"
                                v-model.trim="form.orgName"
                                label="Nama Organisasi"
                                required
                                :disabled="formState.isSubmitting"
                                placeholder="PT Sertifikasi Nusantara"
                                :error="errors.orgName"
                            />

                            <div class="w-full">
                                <label for="slug" class="mb-2 block text-sm font-medium text-slate-200">
                                    URL Subdomain <span class="text-rose-300">*</span>
                                </label>
                                <div class="flex items-stretch">
                                    <div class="relative flex-1">
                                        <input
                                            id="slug"
                                            v-model="slugModel"
                                            type="text"
                                            placeholder="nama-organisasi"
                                            :disabled="formState.isSubmitting"
                                            class="w-full rounded-l-xl rounded-r-none border border-r-0 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-colors focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                                            :class="[
                                                errors.slug
                                                    ? 'border-rose-300/50 focus:border-rose-400'
                                                    : 'border-white/12 focus:border-amber-300/40',
                                            ]"
                                            maxlength="30"
                                        />
                                        <!-- Slug status indicator -->
                                        <div v-if="form.slug.length >= 3" class="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Icon
                                                v-if="slugState.isChecking"
                                                name="lucide:loader-2"
                                                class="h-4 w-4 animate-spin text-slate-400"
                                            />
                                            <Icon
                                                v-else-if="slugState.isAvailable === true"
                                                name="lucide:check-circle-2"
                                                class="h-4 w-4 text-emerald-300"
                                            />
                                            <Icon
                                                v-else-if="slugState.isAvailable === false"
                                                name="lucide:x-circle"
                                                class="h-4 w-4 text-rose-300"
                                            />
                                        </div>
                                    </div>
                                    <span
                                        class="inline-flex items-center rounded-r-xl border border-l-0 border-white/12 bg-white/[0.06] px-3 text-sm text-slate-400"
                                    >
                                        .coreasia.id
                                    </span>
                                </div>
                                <p v-if="errors.slug" class="mt-1 text-xs text-rose-300">
                                    {{ errors.slug }}
                                </p>
                                <p v-else-if="slugState.isAvailable === true && form.slug" class="mt-1 text-xs text-emerald-300">
                                    {{ form.slug }}.coreasia.id tersedia
                                </p>
                                <p v-else-if="slugState.isAvailable === false && slugState.suggestion" class="mt-1 text-xs text-rose-300">
                                    Sudah digunakan. Coba: <button type="button" class="font-semibold underline" @click="slugModel = slugState.suggestion">{{ slugState.suggestion }}</button>
                                </p>
                                <p v-else class="mt-1 text-xs text-slate-500">
                                    Huruf kecil, angka, dan dash. Minimal 3 karakter.
                                </p>
                            </div>

                            <SearchSelect
                                id="orgType"
                                v-model="form.orgType"
                                :options="orgTypes"
                                label="Tipe Organisasi"
                                required
                                :disabled="formState.isSubmitting"
                                placeholder="Pilih tipe organisasi..."
                                :error="errors.orgType"
                            />

                            <!-- Section: Admin Account -->
                            <div class="pt-2">
                                <h2 class="flex items-center gap-2 text-lg font-display font-bold text-white">
                                    <Icon name="lucide:user-circle-2" class="h-5 w-5 text-amber-300" />
                                    Akun Administrator
                                </h2>
                                <div class="mt-1 h-px bg-white/10" />
                            </div>

                            <BaseInput
                                id="fullName"
                                v-model.trim="form.fullName"
                                label="Nama Lengkap"
                                required
                                :disabled="formState.isSubmitting"
                                placeholder="Nama lengkap Anda"
                                :error="errors.fullName"
                            />

                            <div class="grid gap-4 sm:grid-cols-2">
                                <BaseInput
                                    id="email"
                                    v-model.trim="form.email"
                                    type="email"
                                    label="Email"
                                    required
                                    :disabled="formState.isSubmitting"
                                    placeholder="nama@organisasi.id"
                                    :error="errors.email"
                                />
                                <BaseInput
                                    id="phone"
                                    v-model="phoneModel"
                                    type="tel"
                                    label="No. Handphone"
                                    required
                                    :disabled="formState.isSubmitting"
                                    placeholder="+62 812 3456 7890"
                                    :error="errors.phone"
                                />
                            </div>

                            <!-- Password -->
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div class="w-full">
                                    <label for="password" class="mb-2 block text-sm font-medium text-slate-200">
                                        Password <span class="text-rose-300">*</span>
                                    </label>
                                    <div class="relative">
                                        <input
                                            id="password"
                                            v-model="form.password"
                                            :type="showPassword ? 'text' : 'password'"
                                            placeholder="Minimal 8 karakter"
                                            :disabled="formState.isSubmitting"
                                            class="w-full rounded-xl border bg-white/[0.03] px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-500 transition-colors focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                                            :class="[
                                                errors.password
                                                    ? 'border-rose-300/50 focus:border-rose-400'
                                                    : 'border-white/12 focus:border-amber-300/40',
                                            ]"
                                        />
                                        <button
                                            type="button"
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                                            @click="showPassword = !showPassword"
                                        >
                                            <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="h-4 w-4" />
                                        </button>
                                    </div>
                                    <!-- Password strength bar -->
                                    <div v-if="form.password" class="mt-2 flex items-center gap-2">
                                        <div class="flex flex-1 gap-1">
                                            <div
                                                v-for="n in 4"
                                                :key="n"
                                                class="h-1 flex-1 rounded-full transition-colors"
                                                :class="n <= passwordStrength.level ? passwordStrength.color : 'bg-white/10'"
                                            />
                                        </div>
                                        <span class="text-xs text-slate-400">{{ passwordStrength.label }}</span>
                                    </div>
                                    <p v-if="errors.password" class="mt-1 text-xs text-rose-300">
                                        {{ errors.password }}
                                    </p>
                                </div>

                                <div class="w-full">
                                    <label for="confirmPassword" class="mb-2 block text-sm font-medium text-slate-200">
                                        Konfirmasi Password <span class="text-rose-300">*</span>
                                    </label>
                                    <div class="relative">
                                        <input
                                            id="confirmPassword"
                                            v-model="form.confirmPassword"
                                            :type="showConfirmPassword ? 'text' : 'password'"
                                            placeholder="Ulangi password"
                                            :disabled="formState.isSubmitting"
                                            class="w-full rounded-xl border bg-white/[0.03] px-4 py-3 pr-10 text-sm text-white placeholder:text-slate-500 transition-colors focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                                            :class="[
                                                errors.confirmPassword
                                                    ? 'border-rose-300/50 focus:border-rose-400'
                                                    : 'border-white/12 focus:border-amber-300/40',
                                            ]"
                                        />
                                        <button
                                            type="button"
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                                            @click="showConfirmPassword = !showConfirmPassword"
                                        >
                                            <Icon :name="showConfirmPassword ? 'lucide:eye-off' : 'lucide:eye'" class="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p v-if="errors.confirmPassword" class="mt-1 text-xs text-rose-300">
                                        {{ errors.confirmPassword }}
                                    </p>
                                    <p
                                        v-else-if="form.confirmPassword && form.password === form.confirmPassword"
                                        class="mt-1 text-xs text-emerald-300"
                                    >
                                        <Icon name="lucide:check" class="mr-0.5 inline h-3 w-3" />
                                        Password cocok
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
                                Saya setuju dengan
                                <a href="#" class="font-semibold text-amber-300 underline decoration-amber-300/30 underline-offset-4 transition hover:decoration-amber-300">Syarat & Ketentuan</a>
                                dan
                                <a href="#" class="font-semibold text-amber-300 underline decoration-amber-300/30 underline-offset-4 transition hover:decoration-amber-300">Kebijakan Privasi</a>
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
                                {{ formState.isSubmitting ? 'Mendaftarkan...' : 'Daftar Sekarang' }}
                            </button>

                            <!-- Error Message -->
                            <p
                                v-if="formState.errorMessage"
                                class="rounded-lg border border-rose-300/35 bg-rose-300/10 px-3 py-2 text-sm text-rose-100"
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
                                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    Plan Terpilih
                                </p>
                                <NuxtLink
                                    to="/pricing"
                                    class="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 transition hover:text-amber-200"
                                >
                                    <Icon name="lucide:repeat-2" class="h-3.5 w-3.5" />
                                    Ubah Plan
                                </NuxtLink>
                            </div>

                            <h3 class="text-xl font-display font-bold text-white">
                                {{ selectedPlan.name }}
                            </h3>

                            <div class="mt-2 flex items-baseline gap-1">
                                <span class="font-display text-3xl font-bold text-amber-200">
                                    {{ selectedPlan.priceLabel }}
                                </span>
                                <span class="text-sm text-slate-400">{{ selectedPlan.period }}</span>
                            </div>

                            <!-- Plan badge -->
                            <span
                                v-if="selectedPlan.badge"
                                class="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200"
                            >
                                <Icon name="lucide:sparkles" class="h-3 w-3" />
                                {{ selectedPlan.badge }}
                            </span>

                            <div class="my-4 h-px bg-white/10" />

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
                                        class="h-4 w-4 flex-shrink-0 text-emerald-300"
                                    />
                                    <Icon
                                        v-else
                                        name="lucide:minus"
                                        class="h-4 w-4 flex-shrink-0 text-slate-600"
                                    />
                                    <span :class="feature.included ? 'text-slate-200' : 'text-slate-500'">
                                        {{ feature.label }}
                                    </span>
                                </li>
                            </ul>
                        </article>

                        <!-- Plan switcher pills -->
                        <article class="ca-card-soft p-4">
                            <p class="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Pilih Plan Lain
                            </p>
                            <div class="flex gap-2">
                                <button
                                    v-for="plan in plans"
                                    :key="plan.id"
                                    type="button"
                                    class="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-all"
                                    :class="[
                                        plan.id === selectedPlanId
                                            ? 'border-amber-300/40 bg-amber-300/10 text-amber-200'
                                            : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white',
                                    ]"
                                    @click="selectedPlanId = plan.id"
                                >
                                    {{ plan.name }}
                                </button>
                            </div>
                        </article>

                        <!-- Trust signals -->
                        <article class="ca-card-soft p-4">
                            <ul class="space-y-2 text-sm text-slate-300">
                                <li class="flex items-start gap-2">
                                    <Icon name="lucide:shield-check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                                    Data terenkripsi & backup harian otomatis
                                </li>
                                <li class="flex items-start gap-2">
                                    <Icon name="lucide:clock" class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                                    Setup dalam 5 menit, langsung aktif
                                </li>
                                <li class="flex items-start gap-2">
                                    <Icon name="lucide:headphones" class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                                    Support teknis via WhatsApp
                                </li>
                                <li class="flex items-start gap-2">
                                    <Icon name="lucide:credit-card" class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                                    Tanpa kartu kredit untuk trial
                                </li>
                            </ul>
                        </article>
                    </aside>
                </div>
            </div>
        </section>
    </div>
</template>
