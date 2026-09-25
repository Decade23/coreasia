/**
 * Admin user management composable.
 *
 * Pesan galat dipetakan dari kode gateway Fase 0c (utils/konsol.ts
 * pesanKelolaAdmin: password saat ini, sesi TOTP, 409 baris berubah, 423, 429).
 * `galat` menyimpan galat terakhir supaya halaman bisa bereaksi (mis. 409).
 */
import type { GalatAuth } from './useAdminAuth'
import {
  HEADER_CABUT_CASHFLOW, peringatanCabutCashflow, pesanAksiSesiAdmin, ubahMengakhiriSesi,
  type AksiSesiAdmin, type KonfirmasiSesiAdmin,
} from '~/utils/konsol'

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
type SasaranAdmin = Pick<AdminUserDomain, 'id' | 'email' | 'full_name'>

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

  /** Nama untuk pesan: nama lengkap, cadangan email. */
  const namaAdmin = (u: SasaranAdmin) => u.full_name || u.email

  /**
   * Sukses di gateway, lalu hasil pencabutan sesi CashFlow dari header BFF:
   * peringatan MENETAP (durasi 0) bila sesi CashFlow admin itu belum tentu
   * ikut dicabut (runbook console, Langkah 1); selain itu toast sukses biasa.
   */
  const laporTulis = (u: SasaranAdmin, aksi: 'ubah' | 'hapus', headers: Headers, diharapkan: boolean, sukses: string) => {
    const kunci = peringatanCabutCashflow(aksi, headers.get(HEADER_CABUT_CASHFLOW), diharapkan)
    if (kunci) toast.warning(tc(kunci, { name: namaAdmin(u) }), 0)
    else toast.success(tc(sukses))
  }

  const updateUser = async (u: SasaranAdmin, data: Record<string, any>): Promise<boolean> => {
    saving.value = true
    error.value = ''
    galat.value = null
    try {
      const { headers } = await api.tulisDenganHeader('PUT', `/admin/users/${u.id}`, data)
      laporTulis(u, 'ubah', headers, ubahMengakhiriSesi(data), 'feedback.userUpdated')
      return true
    } catch (err) {
      gagal(err, 'update', tc('feedback.userUpdateFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Cabut semua sesi / reset TOTP admin LAIN. Gateway menaikkan token_version
   * admin itu; BFF ikut mencabut sesi CashFlow-nya per id dan melaporkan
   * hasilnya di header X-Konsol-Cashflow-Cabut (pesanAksiSesiAdmin). Syarat
   * sesi kuat untuk reset TOTP (target ber-TOTP) diputuskan gateway; 403-nya
   * dipetakan pesanKelolaAdmin.
   */
  const aksiSesi = async (u: SasaranAdmin, aksi: AksiSesiAdmin): Promise<boolean> => {
    saving.value = true
    error.value = ''
    galat.value = null
    try {
      const jalur = aksi === 'cabut-sesi' ? 'revoke-sessions' : 'totp/reset'
      const { headers } = await api.tulisDenganHeader('POST', `/admin/users/${u.id}/${jalur}`)
      const p = pesanAksiSesiAdmin(aksi, headers.get(HEADER_CABUT_CASHFLOW))
      const teks = tc(p.kunci, { name: namaAdmin(u) })
      if (p.jenis === 'sukses') toast.success(teks)
      else toast.warning(teks, 0)
      return true
    } catch (err) {
      gagal(err, 'update', tc(aksi === 'cabut-sesi' ? 'feedback.sessionsRevokeFailed' : 'feedback.totpResetFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  /* Modal konfirmasi cabut sesi / reset TOTP: satu langkah, tanpa alasan.
     Tertutup hanya bila aksi berhasil; bila gagal, pesan galat tetap di modal. */
  const konfirmasiSesi = ref<KonfirmasiSesiAdmin | null>(null)

  const bukaKonfirmasiSesi = (aksi: AksiSesiAdmin, u: SasaranAdmin) => {
    error.value = ''
    konfirmasiSesi.value = { aksi, user: u }
  }

  const tutupKonfirmasiSesi = () => {
    konfirmasiSesi.value = null
  }

  const jalankanKonfirmasiSesi = async (): Promise<boolean> => {
    const k = konfirmasiSesi.value
    if (!k) return false
    const ok = await aksiSesi(k.user, k.aksi)
    if (ok && konfirmasiSesi.value === k) konfirmasiSesi.value = null
    return ok
  }

  /** Hapus admin: BFF selalu mencabut sesi CashFlow-nya (adminDiakhiri DELETE). */
  const deleteUser = async (u: SasaranAdmin): Promise<boolean> => {
    saving.value = true
    error.value = ''
    galat.value = null
    try {
      const { headers } = await api.tulisDenganHeader('DELETE', `/admin/users/${u.id}`)
      laporTulis(u, 'hapus', headers, true, 'feedback.userDeleted')
      return true
    } catch (err) {
      gagal(err, 'delete', tc('feedback.userDeleteFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    items, loading, saving, error, galat, totalItems, fetchUsers, createUser, updateUser, deleteUser, aksiSesi,
    konfirmasiSesi, bukaKonfirmasiSesi, tutupKonfirmasiSesi, jalankanKonfirmasiSesi,
  }
}
