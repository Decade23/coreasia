/**
 * Admin user management composable.
 *
 * Pesan galat dipetakan dari kode gateway Fase 0c (utils/konsol.ts
 * pesanKelolaAdmin: password saat ini, sesi TOTP, 409 baris berubah, 423, 429).
 * `galat` menyimpan galat terakhir supaya halaman bisa bereaksi (mis. 409).
 */
import type { GalatAuth } from './useAdminAuth'

export interface AdminUserDomain {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

type AksiAdmin = 'create' | 'update' | 'delete'

export const useAdminUsers = () => {
  const api = useAdminApi()
  const toast = useToast()
  const { tc } = useConsoleI18n()
  const items = ref<AdminUserDomain[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const galat = ref<GalatAuth | null>(null)
  const totalItems = ref(0)

  /** Kode gateway → i18n (utils/konsol.ts pesanKelolaAdmin), cadangan bila tanpa pesan. */
  const pesanGalat = (g: GalatAuth, aksi: AksiAdmin, cadangan: string): string => {
    const p = pesanKelolaAdmin(g, aksi)
    if (!p) return cadangan
    return 'teks' in p ? p.teks : tc(p.kunci, p.param)
  }

  const gagal = (err: unknown, aksi: AksiAdmin, cadangan: string) => {
    const g = galatDari(err)
    galat.value = g
    error.value = pesanGalat(g, aksi, cadangan)
    toast.error(error.value)
  }

  const fetchUsers = async (page = 1) => {
    loading.value = true
    error.value = ''
    try {
      const res = await api.get<AdminUserDomain[]>('/admin/users', { page, per_page: 10 })
      items.value = res.data || []
      totalItems.value = res.meta?.total || 0
    } catch (err: any) {
      error.value = err?.data?.errors?.message || tc('feedback.usersLoadFailed')
    } finally {
      loading.value = false
    }
  }

  const createUser = async (data: { email: string; password: string; full_name: string; role: string }): Promise<boolean> => {
    saving.value = true
    error.value = ''
    galat.value = null
    try {
      await api.post('/admin/users', data)
      toast.success(tc('feedback.userCreated'))
      return true
    } catch (err) {
      gagal(err, 'create', tc('feedback.userCreateFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  const updateUser = async (id: string, data: Record<string, any>): Promise<boolean> => {
    saving.value = true
    error.value = ''
    galat.value = null
    try {
      await api.put(`/admin/users/${id}`, data)
      toast.success(tc('feedback.userUpdated'))
      return true
    } catch (err) {
      gagal(err, 'update', tc('feedback.userUpdateFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  const deleteUser = async (id: string): Promise<boolean> => {
    saving.value = true
    error.value = ''
    galat.value = null
    try {
      await api.del(`/admin/users/${id}`)
      toast.success(tc('feedback.userDeleted'))
      return true
    } catch (err) {
      gagal(err, 'delete', tc('feedback.userDeleteFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  return { items, loading, saving, error, galat, totalItems, fetchUsers, createUser, updateUser, deleteUser }
}
