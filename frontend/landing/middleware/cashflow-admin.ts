/**
 * Gerbang KEDUA modul CashFlow — sesi Supabase yang sudah lewat TOTP.
 *
 * Dipasang bersama middleware 'console' (gerbang pertama, cookie gateway):
 *   definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
 *
 * Yang diperiksa, berurutan:
 *   1. ada sesi Supabase di tab ini;
 *   2. sesinya ber-aal2 — kata sandi + TOTP, bukan kata sandi saja.
 * Gagal salah satunya → /console/cashflow/masuk. Halaman masuk sendiri TIDAK
 * memakai middleware ini (kalau iya, ia mengusir dirinya sendiri).
 *
 * Hanya berjalan di klien: sesinya hidup di sessionStorage, dan di SSR tidak
 * ada yang bisa diperiksa. Halaman modul memang tidak merender data di server.
 *
 * Catatan penting: lolos di sini BELUM berarti boleh membaca data. Yang
 * memutuskan itu is_platform_admin() di setiap RPC — admin console yang bukan
 * admin CashFlow akan lolos gerbang ini lalu ditolak 42501 oleh server, dan
 * halaman menampilkan kalimat "akun ini belum terdaftar sebagai admin CashFlow"
 * tanpa membocorkan siapa yang terdaftar.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/console/cashflow/masuk') return

  const { $cashflowSupabase } = useNuxtApp()
  if (!$cashflowSupabase) {
    return navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'konfigurasi' } })
  }

  const { data: { session } } = await $cashflowSupabase.auth.getSession()
  if (!session) {
    return navigateTo({ path: '/console/cashflow/masuk', query: { ke: to.fullPath } })
  }

  const { data: aal } = await $cashflowSupabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel !== 'aal2') {
    return navigateTo({ path: '/console/cashflow/masuk', query: { ke: to.fullPath, sebab: 'totp' } })
  }
})
