/**
 * Sesi Supabase modul CashFlow, dibuatkan server dari cookie console.
 *
 * `sambung()` = POST /api/cashflow/sesi → setSession. Tidak ada kata sandi,
 * tidak ada TOTP: gerbangnya login console. Kode sebab gagal mengikuti
 * statusMessage rute server (lihat server/api/cashflow/sesi.post.ts) supaya
 * halaman /masuk bisa menjelaskan dengan kalimat manusia.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type HasilSambung = { ok: true } | { ok: false; sebab: string }

export const useCashflowSesi = () => {
  const { $cashflowSupabase } = useNuxtApp()
  const sb = $cashflowSupabase as SupabaseClient | null
  const sibuk = useState<boolean>('cf_sibuk_sesi', () => false)
  /** Email admin console yang sesinya dibuat — awalan alasan audit. */
  const pelaku = useState<string>('cf_pelaku', () => '')
  const terkonfigurasi = computed(() => !!sb)

  const sambung = async (): Promise<HasilSambung> => {
    if (!sb) return { ok: false, sebab: 'konfigurasi' }
    sibuk.value = true
    try {
      const r = await $fetch<{ access_token: string; refresh_token: string; pelaku?: string }>(
        '/api/cashflow/sesi', { method: 'POST' },
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
    if (sb) await sb.auth.signOut()
    pelaku.value = ''
  }

  return { sb, sibuk, pelaku, terkonfigurasi, sambung, keluar }
}
