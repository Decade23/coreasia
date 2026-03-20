/**
 * API Key management composable.
 */

interface APIKeyDomain {
  id: string
  name: string
  provider: string
  key_masked: string
  description: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export const useApiKeys = () => {
  const api = useAdminApi()
  const toast = useToast()
  const items = ref<APIKeyDomain[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  const fetchKeys = async () => {
    loading.value = true
    error.value = ''
    try {
      const res = await api.get<APIKeyDomain[]>('/admin/api-keys')
      items.value = res.data || []
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal memuat API keys'
    } finally {
      loading.value = false
    }
  }

  const createKey = async (data: { name: string; provider: string; key_value: string; description?: string }): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.post('/admin/api-keys', data)
      toast.success('API key berhasil ditambahkan')
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal membuat API key'
      toast.error(error.value)
      return false
    } finally {
      saving.value = false
    }
  }

  const updateKey = async (id: string, data: Record<string, any>): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.put(`/admin/api-keys/${id}`, data)
      toast.success('API key berhasil diperbarui')
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal update API key'
      toast.error(error.value)
      return false
    } finally {
      saving.value = false
    }
  }

  const deleteKey = async (id: string): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.del(`/admin/api-keys/${id}`)
      toast.success('API key berhasil dihapus')
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal hapus API key'
      toast.error(error.value)
      return false
    } finally {
      saving.value = false
    }
  }

  const copyKey = async (id: string): Promise<string | null> => {
    try {
      const res = await api.get<{ key_value: string }>(`/admin/api-keys/${id}/copy`)
      if (res.data?.key_value) {
        await navigator.clipboard.writeText(res.data.key_value)
        toast.success('API key berhasil disalin ke clipboard')
      }
      return res.data?.key_value || null
    } catch {
      toast.error('Gagal menyalin API key')
      return null
    }
  }

  return { items, loading, saving, error, fetchKeys, createKey, updateKey, deleteKey, copyKey }
}
