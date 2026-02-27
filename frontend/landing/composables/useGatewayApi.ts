/**
 * Gateway API composable for onboarding operations.
 * Currently uses mock implementations; will connect to real API when backend is ready.
 */

export interface PricingPlan {
    id: string
    name: string
    price: number
    priceLabel: string
    period: string
    badge?: string
    popular?: boolean
    features: PlanFeature[]
    cta: {
        label: string
        to: string
        external?: boolean
    }
}

export interface PlanFeature {
    label: string
    included: boolean
}

export interface RegisterPayload {
    organization: {
        name: string
        slug: string
        type: string
    }
    admin: {
        fullName: string
        email: string
        phone: string
        password: string
    }
    plan: string
}

export interface SlugCheckResult {
    available: boolean
    suggestion?: string
}

export interface RegisterResult {
    success: boolean
    message: string
    tenantId?: string
    redirectUrl?: string
}

const MOCK_PLANS: PricingPlan[] = [
    {
        id: 'starter',
        name: 'Starter',
        price: 750000,
        priceLabel: 'Rp 750.000',
        period: '/bulan',
        badge: '14 hari trial gratis',
        features: [
            { label: '50 asesi/bulan', included: true },
            { label: '3 skema sertifikasi', included: true },
            { label: '1 admin', included: true },
            { label: 'CBT Online', included: true },
            { label: 'WhatsApp Notifikasi', included: false },
            { label: 'API Access', included: false },
            { label: 'Custom Domain', included: false },
            { label: 'BNSP Export', included: false },
            { label: 'Dedicated Support', included: false },
        ],
        cta: {
            label: 'Mulai Gratis',
            to: '/register?plan=starter',
        },
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 2500000,
        priceLabel: 'Rp 2.500.000',
        period: '/bulan',
        badge: 'Paling Populer',
        popular: true,
        features: [
            { label: '500 asesi/bulan', included: true },
            { label: '20 skema sertifikasi', included: true },
            { label: '5 admin', included: true },
            { label: 'CBT Online', included: true },
            { label: 'WhatsApp Notifikasi', included: true },
            { label: 'API Access', included: true },
            { label: 'Custom Domain', included: false },
            { label: 'BNSP Export', included: true },
            { label: 'Dedicated Support', included: false },
        ],
        cta: {
            label: 'Pilih Plan',
            to: '/register?plan=professional',
        },
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 7000000,
        priceLabel: 'Rp 7.000.000',
        period: '/bulan',
        badge: 'Custom',
        features: [
            { label: 'Unlimited asesi', included: true },
            { label: 'Unlimited skema', included: true },
            { label: 'Unlimited admin', included: true },
            { label: 'CBT Online', included: true },
            { label: 'WhatsApp Notifikasi', included: true },
            { label: 'API Access', included: true },
            { label: 'Custom Domain', included: true },
            { label: 'BNSP Export', included: true },
            { label: 'Dedicated Support', included: true },
        ],
        cta: {
            label: 'Hubungi Kami',
            to: '/contact',
        },
    },
]

// Taken slugs for mock validation
const TAKEN_SLUGS = ['demo', 'admin', 'api', 'app', 'coreasia', 'test', 'staging']

export const useGatewayApi = () => {
    const config = useRuntimeConfig()
    const baseURL = config.public?.gatewayUrl || 'http://localhost:8081/api'

    /**
     * Fetch available pricing plans.
     * Mock: returns hardcoded plans. Real: GET /api/onboarding/plans
     */
    const fetchPlans = async (): Promise<PricingPlan[]> => {
        // TODO: Replace with real API call
        // const { data } = await useFetch(`${baseURL}/onboarding/plans`)
        await new Promise(resolve => setTimeout(resolve, 100))
        return MOCK_PLANS
    }

    /**
     * Check subdomain slug availability.
     * Mock: checks against a hardcoded list. Real: GET /api/onboarding/check-slug?slug=xxx
     */
    const checkSlug = async (slug: string): Promise<SlugCheckResult> => {
        // TODO: Replace with real API call
        // const { data } = await useFetch(`${baseURL}/onboarding/check-slug`, { params: { slug } })
        await new Promise(resolve => setTimeout(resolve, 300))

        const normalized = slug.toLowerCase().trim()
        const isTaken = TAKEN_SLUGS.includes(normalized)

        return {
            available: !isTaken,
            suggestion: isTaken ? `${normalized}-lsp` : undefined,
        }
    }

    /**
     * Register a new tenant.
     * Mock: returns success. Real: POST /api/onboarding/register
     */
    const register = async (data: RegisterPayload): Promise<RegisterResult> => {
        // TODO: Replace with real API call
        // const result = await $fetch(`${baseURL}/onboarding/register`, { method: 'POST', body: data })
        await new Promise(resolve => setTimeout(resolve, 1500))

        return {
            success: true,
            message: 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.',
            tenantId: `tenant_${Date.now()}`,
            redirectUrl: `/register/success`,
        }
    }

    return {
        baseURL,
        fetchPlans,
        checkSlug,
        register,
    }
}
