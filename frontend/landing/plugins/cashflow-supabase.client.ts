/**
 * Klien Supabase untuk modul CashFlow di /console/cashflow.
 *
 * Console masuk lewat gateway Go (cookie auth_admin_token). Data CashFlow hidup
 * di Supabase dan setiap RPC admin-nya menuntut sesi Supabase asli dari akun
 * yang terdaftar di admin_users — RLS dan kolom pelaku di admin_audit
 * bergantung padanya. Sesi itu TIDAK diminta dari pengguna: server Nitro
 * membuatkannya dari cookie console yang sudah tervalidasi
 * (server/api/cashflow/sesi.post.ts, dipanggil middleware cashflow-admin).
 * Klien ini hanya wadahnya.
 *
 * KENAPA sessionStorage, BUKAN localStorage (bawaan supabase-js)
 *
 * localStorage bertahan lintas tab dan lintas restart peramban; sesi yang bisa
 * membuka data keuangan orang tidak perlu bertahan selama itu di mesin yang
 * mungkin dipakai bersama. sessionStorage mati bersama tab, dan karena sesinya
 * dibuat ulang otomatis, harganya bagi pengguna nol.
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
