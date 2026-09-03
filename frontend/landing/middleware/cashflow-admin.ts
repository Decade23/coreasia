/**
 * Sesi modul CashFlow — dibuat OTOMATIS dari login console.
 *
 * Dipasang bersama middleware 'console' (cookie gateway):
 *   definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
 *
 * Dulu ini gerbang kedua (email + sandi + TOTP Supabase). Pemilik memutuskan
 * satu login cukup, jadi sekarang: kalau belum ada sesi Supabase di tab ini,
 * minta server membuatkannya (POST /api/cashflow/sesi — cookie console
 * divalidasi ke gateway di sana, lalu sesi untuk identitas konsol
 * dipulangkan) dan pasang. Gagal → /console/cashflow/masuk yang menjelaskan
 * sebabnya dan menawarkan coba lagi; halaman itu sendiri TIDAK memakai
 * middleware ini.
 *
 * Hanya berjalan di klien: sesinya hidup di sessionStorage. Halaman modul
 * memang tidak merender data di server.
 *
 * Lolos di sini BELUM berarti boleh membaca data: is_platform_admin() di
 * setiap RPC yang memutuskan (identitas konsol ditandai lewat_konsol).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/console/cashflow/masuk') return

  const { $cashflowSupabase } = useNuxtApp()
  if (!$cashflowSupabase) {
    return navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'konfigurasi', ke: to.fullPath } })
  }

  const { data: { session } } = await $cashflowSupabase.auth.getSession()
  if (session) return

  const hasil = await useCashflowSesi().sambung()
  if (!hasil.ok) {
    return navigateTo({ path: '/console/cashflow/masuk', query: { sebab: hasil.sebab, ke: to.fullPath } })
  }
})
