/**
 * Admin user management composable.
 */

export interface AdminUserDomain {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export const useAdminUsers = () => {
  const api = useAdminApi()
  const items = ref<AdminUserDomain[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const totalItems = ref(0)

  const fetchUsers = async (page = 1) => {
    loading.value = true
    error.value = ''
    try {
      const res = await api.get<AdminUserDomain[]>('/admin/users', { page, per_page: 10 })
      items.value = res.data || []
      totalItems.value = res.meta?.total || 0
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal memuat users'
    } finally {
      loading.value = false
    }
  }

  const createUser = async (data: { email: string; password: string; full_name: string; role: string }): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.post('/admin/users', data)
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal membuat user'
      return false
    } finally {
      saving.value = false
    }
  }

  const updateUser = async (id: string, data: Record<string, any>): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.put(`/admin/users/${id}`, data)
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal mengupdate user'
      return false
    } finally {
      saving.value = false
    }
  }

  const deleteUser = async (id: string): Promise<boolean> => {
    saving.value = true
    error.value = ''
    try {
      await api.del(`/admin/users/${id}`)
      return true
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal menghapus user'
      return false
    } finally {
      saving.value = false
    }
  }

  return { items, loading, saving, error, totalItems, fetchUsers, createUser, updateUser, deleteUser }
}
