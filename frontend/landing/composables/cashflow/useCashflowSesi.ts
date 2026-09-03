/**
 * Sesi Supabase modul CashFlow, dibuatkan server dari cookie console.
 *
 * `sambung()` = POST /api/cashflow/sesi → setSession. Tidak ada kata sandi,
 * tidak ada TOTP: gerbangnya login console. `keluar()` = DELETE rute yang
 * sama (mencabut sesi tab ini di server) lalu signOut lokal — bukan global,
 * karena identitas konsol dipakai bersama semua tab dan admin.
 *
 * Kode sebab gagal mengikuti statusMessage rute server
 * (server/api/cashflow/sesi.post.ts) supaya halaman /masuk bisa menjelaskan
 * dengan kalimat manusia. Urutan pembacaannya: e.data.statusMessage (badan
 * JSON Nitro) → e.statusMessage (statusText; kosong di HTTP/2) → http-N → jaringan.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type HasilSambung = { ok: true } | { ok: false; sebab: string }

export const useCashflowSesi = () => {
  const { $cashflowSupabase } = useNuxtApp()
  const sb = $cashflowSupabase as SupabaseClient | null
  const sibuk = useState<boolean>('cf_sibuk_sesi', () => false)
  /** Email admin console yang sesinya dibuat — untuk tampilan; buktinya di server. */
  const pelaku = useState<string>('cf_pelaku', () => '')
  const terkonfigurasi = computed(() => !!sb)

  const sambung = async (): Promise<HasilSambung> => {
    if (!sb) return { ok: false, sebab: 'konfigurasi' }
    if (sibuk.value) return { ok: false, sebab: 'sibuk' }
    sibuk.value = true
    try {
      const r = await $fetch<{ access_token: string; refresh_token: string; pelaku?: string }>(
        '/api/cashflow/sesi', { method: 'POST', headers: { 'X-CF-Sesi': '1' } },
      )
      const { error } = await sb.auth.setSession({ access_token: r.access_token, refresh_token: r.refresh_token })
      if (error) return { ok: false, sebab: 'sesi' }
      pelaku.value = r.pelaku ?? ''
      return { ok: true }
    } catch (e: any) {
      const sebab: string = e?.data?.statusMessage || e?.statusMessage || (e?.status ? `http-${e.status}` : 'jaringan')
      return { ok: false, sebab }
    } finally {
      sibuk.value = false
    }
  }

  const keluar = async () => {
    if (!sb) return
    try {
      const { data } = await sb.auth.getSession()
      const token = data.session?.access_token
      if (token) {
        await $fetch('/api/cashflow/sesi', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
          .catch(() => {})
      }
    } finally {
      await sb.auth.signOut({ scope: 'local' }).catch(() => {})
      pelaku.value = ''
    }
  }

  return { sb, sibuk, pelaku, terkonfigurasi, sambung, keluar }
}
