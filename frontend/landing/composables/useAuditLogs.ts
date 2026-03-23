/**
 * Audit log composable for admin panel.
 */

export interface AuditLogDomain {
  id: string
  user_id: string | null
  user_name: string | null
  action: string
  resource: string
  resource_id: string | null
  description: string | null
  ip_address: string | null
  created_at: string
}

export const useAuditLogs = () => {
  const api = useAdminApi()
  const { tc } = useConsoleI18n()
  const logs = ref<AuditLogDomain[]>([])
  const loading = ref(false)
  const error = ref('')
  const totalItems = ref(0)

  const fetchLogs = async (page = 1, resource = '') => {
    loading.value = true
    error.value = ''
    try {
      const params: Record<string, any> = { page, per_page: 20 }
      if (resource) params.resource = resource
      const res = await api.get<AuditLogDomain[]>('/admin/audit-logs', params)
      logs.value = res.data || []
      totalItems.value = res.meta?.total || 0
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.auditLoadFailed')
    } finally {
      loading.value = false
    }
  }

  return { logs, loading, error, totalItems, fetchLogs }
}
