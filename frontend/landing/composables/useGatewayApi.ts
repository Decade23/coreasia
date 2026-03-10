/**
 * Gateway API composable for onboarding operations.
 * Connects to real Gateway backend at /api/* endpoints.
 *
 * Adapter layer transforms backend DTOs into frontend-friendly interfaces.
 */

// ── Frontend Domain Types ──────────────────────────────────────────

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
    status?: string
    tenantId?: string
    redirectUrl?: string
}

export interface RegistrationStatusResult {
    registrationId: string
    status: string
    paymentStatus: string
    provisionStatus: string
    loginUrl?: string
    invoiceUrl?: string
}

// ── Backend DTO Types (matches Go model/plan.go, model/request.go) ──

interface PlanDTO {
    id: string
    name: string
    max_assessees: number
    max_schemes: number
    features: Record<string, boolean>
    price_monthly: number
}

interface SlugCheckDTO {
    slug: string
    available: boolean
}

interface RegisterResponseDTO {
    registration_id: string
    status: string
    login_url?: string
    invoice_url?: string
}

interface RegistrationStatusResponseDTO {
    registration_id: string
    status: string
    payment_status: string
    provision_status: string
    login_url?: string
    invoice_url?: string
}

interface ApiResponse<T> {
    data: T
    errors?: {
        code: string
        message: string
        details?: Array<{ field: string; message: string }>
    }
}

// ── Adapter: Backend DTO → Frontend Domain ──────────────────────────

const FEATURE_LABELS: Record<string, string> = {
    cbt: 'CBT Online',
    api_access: 'API Access',
    whatsapp: 'WhatsApp Notifikasi',
    custom_domain: 'Custom Domain',
    bnsp_export: 'BNSP Export',
    dedicated_support: 'Dedicated Support',
}

/**
 * All feature keys that should be listed on the pricing card,
 * in display order. If a plan doesn't have a key, it's marked as excluded.
 */
const ALL_FEATURE_KEYS = [
    'cbt',
    'whatsapp',
    'api_access',
    'custom_domain',
    'bnsp_export',
    'dedicated_support',
]

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp').trim()
}

function adaptPlanToUI(dto: PlanDTO, allPlans: PlanDTO[]): PricingPlan {
    const nameLower = dto.name.toLowerCase()

    // Build capacity features first
    const capacityFeatures: PlanFeature[] = [
        {
            label: dto.max_assessees >= 9999 ? 'Unlimited asesi' : `${dto.max_assessees} asesi/bulan`,
            included: true,
        },
        {
            label: dto.max_schemes >= 999 ? 'Unlimited skema' : `${dto.max_schemes} skema sertifikasi`,
            included: true,
        },
    ]

    // Build feature list from ALL_FEATURE_KEYS
    const boolFeatures: PlanFeature[] = ALL_FEATURE_KEYS.map(key => ({
        label: FEATURE_LABELS[key] || key,
        included: Boolean(dto.features?.[key]),
    }))

    // Determine badges and CTA based on plan tier
    let badge: string | undefined
    let popular = false
    let ctaLabel = 'Mulai Sekarang'
    let ctaTo = `/register?plan=${dto.id}`

    if (dto.price_monthly === 0) {
        badge = '14 hari trial gratis'
        ctaLabel = 'Mulai Gratis'
    } else if (nameLower.includes('enterprise') || allPlans.indexOf(dto) === allPlans.length - 1) {
        badge = 'Custom'
        ctaLabel = 'Hubungi Kami'
        ctaTo = '/contact'
    } else {
        // Middle tier(s) are "popular"
        const midIndex = Math.floor(allPlans.length / 2)
        if (allPlans.indexOf(dto) === midIndex || allPlans.length === 2) {
            popular = true
            badge = 'Paling Populer'
        }
        ctaLabel = 'Pilih Plan'
    }

    return {
        id: dto.id,
        name: dto.name,
        price: dto.price_monthly,
        priceLabel: dto.price_monthly === 0 ? 'Gratis' : formatCurrency(dto.price_monthly),
        period: dto.price_monthly === 0 ? '' : '/bulan',
        badge,
        popular,
        features: [...capacityFeatures, ...boolFeatures],
        cta: {
            label: ctaLabel,
            to: ctaTo,
        },
    }
}

// ── Composable ──────────────────────────────────────────────────────

export const useGatewayApi = () => {
    const config = useRuntimeConfig()
    const baseURL = config.public?.gatewayUrl || 'http://localhost:8081/api'

    /**
     * Fetch available pricing plans from the gateway API.
     * GET /api/plans → adapted to PricingPlan[]
     */
    const fetchPlans = async (): Promise<PricingPlan[]> => {
        try {
            const res = await $fetch<ApiResponse<PlanDTO[]>>(`${baseURL}/plans`)

            if (!res?.data || !Array.isArray(res.data)) {
                console.warn('[useGatewayApi] Unexpected plans response shape:', res)
                return []
            }

            return res.data.map(dto => adaptPlanToUI(dto, res.data))
        } catch (err: unknown) {
            console.error('[useGatewayApi] Failed to fetch plans:', err)
            return []
        }
    }

    /**
     * Check subdomain slug availability.
     * GET /api/onboarding/check-slug?slug=xxx
     */
    const checkSlug = async (slug: string): Promise<SlugCheckResult> => {
        try {
            const res = await $fetch<ApiResponse<SlugCheckDTO>>(
                `${baseURL}/onboarding/check-slug`,
                { params: { slug } },
            )

            return {
                available: res?.data?.available ?? false,
                suggestion: !res?.data?.available ? `${slug}-lsp` : undefined,
            }
        } catch (err: unknown) {
            console.error('[useGatewayApi] Slug check failed:', err)
            return { available: false }
        }
    }

    /**
     * Register a new tenant.
     * POST /api/onboarding/register
     *
     * Transforms the frontend RegisterPayload into backend RegisterRequest format.
     */
    const register = async (data: RegisterPayload): Promise<RegisterResult> => {
        try {
            // Transform frontend payload → backend DTO
            const body = {
                org_name: data.organization.name,
                slug: data.organization.slug,
                org_type: data.organization.type,
                admin_name: data.admin.fullName,
                admin_email: data.admin.email,
                admin_phone: data.admin.phone,
                password: data.admin.password,
                plan_id: data.plan,
            }

            const res = await $fetch<ApiResponse<RegisterResponseDTO>>(
                `${baseURL}/onboarding/register`,
                { method: 'POST', body },
            )

            if (res?.errors) {
                return {
                    success: false,
                    message: res.errors.message || 'Terjadi kesalahan. Silakan coba lagi.',
                }
            }

            const dto = res?.data
            const redirectUrl = dto?.invoice_url || dto?.login_url

            return {
                success: true,
                status: dto?.status,
                message: dto?.status === 'pending_payment'
                    ? 'Pendaftaran berhasil. Anda akan diarahkan ke halaman pembayaran.'
                    : 'Pendaftaran berhasil! Workspace Anda sedang disiapkan.',
                tenantId: dto?.registration_id,
                redirectUrl: redirectUrl || undefined,
            }
        } catch (err: unknown) {
            // Parse error response from Fiber
            const fetchErr = err as { data?: ApiResponse<null> }
            const apiMessage = fetchErr?.data?.errors?.message

            return {
                success: false,
                message: apiMessage || 'Koneksi gagal. Periksa koneksi internet Anda.',
            }
        }
    }

    const getRegistrationStatus = async (registrationId: string): Promise<RegistrationStatusResult | null> => {
        try {
            const res = await $fetch<ApiResponse<RegistrationStatusResponseDTO>>(
                `${baseURL}/onboarding/status/${registrationId}`,
            )

            const dto = res?.data
            if (!dto) {
                return null
            }

            return {
                registrationId: dto.registration_id,
                status: dto.status,
                paymentStatus: dto.payment_status,
                provisionStatus: dto.provision_status,
                loginUrl: dto.login_url || undefined,
                invoiceUrl: dto.invoice_url || undefined,
            }
        } catch (err) {
            console.error('[useGatewayApi] Failed to fetch registration status:', err)
            return null
        }
    }

    return {
        baseURL,
        fetchPlans,
        checkSlug,
        register,
        getRegistrationStatus,
    }
}
