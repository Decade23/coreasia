export interface BriefDelivery {
    channel: string
    status: string
    attempts: number
    delivered_at: string | null
}
export interface AdminBrief {
    id: string
    reference: string
    name: string
    email: string
    phone: string
    subject: string
    preferred_contact: string
    organization: string
    created_at: string
    deliveries: BriefDelivery[]
    message?: string
    budget_range?: string
    timeline?: string
    selected_plan?: string
    consented_at?: string
}

export const useBriefs = () => {
    const api = useAdminApi()
    const items = ref<AdminBrief[]>([])
    const detail = ref<AdminBrief | null>(null)
    const loading = ref(false)
    const failed = ref(false)
    const total = ref(0)
    let sequence = 0
    const load = async (page: number, search = '') => {
        const seq = ++sequence
        loading.value = true
        failed.value = false
        try {
            const response = await api.get<AdminBrief[]>('/admin/briefs', { page, per_page: 25, search })
            if (seq !== sequence) return
            items.value = response.data || []
            total.value = response.meta?.total || 0
        } catch {
            if (seq === sequence) { failed.value = true; items.value = []; total.value = 0 }
        } finally { if (seq === sequence) loading.value = false }
    }
    const loadDetail = async (id: string) => {
        loading.value = true
        failed.value = false
        detail.value = null
        try { detail.value = (await api.get<AdminBrief>(`/admin/briefs/${encodeURIComponent(id)}`)).data }
        catch { failed.value = true }
        finally { loading.value = false }
    }
    onBeforeUnmount(() => { sequence++ })
    return { items, detail, loading, failed, total, load, loadDetail }
}
