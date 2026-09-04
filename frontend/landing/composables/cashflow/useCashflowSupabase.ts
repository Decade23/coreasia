/**
 * Klien Supabase modul CashFlow — dimuat MALAS, hanya saat modul dibuka.
 *
 * Dulu klien ini dibuat di plugin .client, dan itu berarti supabase-js
 * (+58 kB gzip) ikut dieksekusi di setiap halaman publik landing — halaman
 * iklan yang tidak pernah menyentuh CashFlow. Sekarang pustakanya diimpor
 * dinamis dari sini, pertama kali ada yang membutuhkannya (middleware
 * cashflow-admin atau RPC), dan dipakai ulang sesudahnya.
 *
 * Sesi hidup di sessionStorage (mati bersama tab); karena sesinya dibuatkan
 * server otomatis, harganya bagi pengguna nol. Hanya ada di peramban — di SSR
 * tidak ada sessionStorage, dan tidak ada halaman modul yang merender data di
 * server.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

let klien: SupabaseClient | null = null
let memuat: Promise<SupabaseClient | null> | null = null

export const useCashflowSupabase = () => {
  const config = useRuntimeConfig()
  const url = config.public.cashflowSupabaseUrl as string
  const anon = config.public.cashflowSupabaseAnonKey as string
  const terkonfigurasi = computed(() => !!url && !!anon)

  /** Null bila env belum dipasang atau dipanggil di server. */
  const ambil = (): Promise<SupabaseClient | null> => {
    if (import.meta.server || !url || !anon) return Promise.resolve(null)
    if (klien) return Promise.resolve(klien)
    if (!memuat) {
      memuat = import('@supabase/supabase-js').then(({ createClient }) => {
        klien = createClient(url, anon, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            storage: window.sessionStorage,
            storageKey: 'cf-console-sesi',
          },
        })
        return klien
      }).finally(() => { memuat = null })
    }
    return memuat
  }

  return { ambil, terkonfigurasi }
}
