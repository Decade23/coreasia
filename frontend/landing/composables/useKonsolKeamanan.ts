/**
 * Keamanan akun console: TOTP dan pencabutan sesi (gateway Fase 0c).
 *
 * Semua lewat proxy /api/gw (useAdminApi). Enable, disable, dan logout-all
 * menaikkan token_version di gateway sehingga SEMUA sesi admin ini gugur; proxy
 * lalu menghapus cookie sesi dan mencabut sesi CashFlow-nya di server. Halaman
 * memanggil useAdminAuth().sesiDiakhiri() sesudahnya.
 */
import type { GalatAuth } from './useAdminAuth'

export interface PendaftaranTotp {
  otpauth_url: string
  secret: string
  issuer: string
  account: string
}

export const useKonsolKeamanan = () => {
  const api = useAdminApi()
  const sibuk = ref(false)

  const jalankan = async <T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; galat: GalatAuth }> => {
    sibuk.value = true
    try {
      return { ok: true, data: await fn() }
    } catch (err) {
      return { ok: false, galat: galatDari(err) }
    } finally {
      sibuk.value = false
    }
  }

  /** Sandi saat ini wajib (gateway): token/cookie curian saja tidak cukup. */
  const mulaiPasang = (password: string) =>
    jalankan(async () => (await api.post<PendaftaranTotp>('/admin/auth/totp/setup', { password })).data)

  const aktifkan = (code: string) => jalankan(() => api.post('/admin/auth/totp/enable', { code }))

  const matikan = (code: string) => jalankan(() => api.post('/admin/auth/totp/disable', { code }))

  const keluarSemua = () => jalankan(() => api.post('/admin/auth/logout-all'))

  return { sibuk, mulaiPasang, aktifkan, matikan, keluarSemua }
}
