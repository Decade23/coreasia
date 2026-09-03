/**
 * Klien Supabase untuk modul CashFlow di /console/cashflow — SESI KEDUA.
 *
 * Console masuk lewat gateway Go (cookie auth_admin_token). Data CashFlow hidup
 * di Supabase dan setiap RPC admin-nya menuntut sesi Supabase ber-TOTP (aal2)
 * dari akun yang terdaftar di admin_users CashFlow. Cookie console tidak pernah
 * cukup — dan itu disengaja: data keuangan orang tidak boleh terbuka hanya
 * dengan kata sandi. Jadi modul ini membawa sesinya sendiri.
 *
 * KENAPA sessionStorage, BUKAN localStorage (bawaan supabase-js)
 *
 * localStorage bertahan lintas tab dan lintas restart peramban; sesi admin yang
 * bisa membuka data keuangan 16 orang tidak boleh bertahan selama itu di mesin
 * yang mungkin dipakai bersama. sessionStorage mati bersama tab. Harganya: tab
 * baru = masuk lagi (email + sandi + TOTP). Untuk satu admin yang memakainya
 * setiap hari, itu harga yang wajar; kalau terlalu menyebalkan, alternatifnya
 * cookie Secure; SameSite=Strict berumur pendek — bukan localStorage.
 *
 * `.client.ts`: klien ini hanya ada di peramban. Di SSR tidak ada sessionStorage,
 * dan tidak ada halaman modul yang dirender dengan data di server.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const url = config.public.cashflowSupabaseUrl as string
  const anon = config.public.cashflowSupabaseAnonKey as string

  // Tanpa env, modul tidak boleh setengah hidup: halaman akan menampilkan
  // keadaan "belum dikonfigurasi", bukan galat jaringan yang membingungkan.
  const client: SupabaseClient | null = url && anon
    ? createClient(url, anon, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storage: window.sessionStorage,
          storageKey: 'cf-console-sesi',
        },
      })
    : null

  return { provide: { cashflowSupabase: client } }
})
