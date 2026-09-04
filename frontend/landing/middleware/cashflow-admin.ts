/**
 * Sesi modul CashFlow — dibuat OTOMATIS dari login console.
 *
 * Dipasang bersama middleware 'console' (cookie gateway):
 *   definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
 *
 * Dulu ini gerbang kedua (email + sandi + TOTP Supabase). Pemilik memutuskan
 * satu login cukup, jadi sekarang: kalau tab belum punya sesi Supabase, minta
 * server membuatkannya (POST /api/cashflow/sesi — cookie console divalidasi
 * ke gateway di sana, sesi identitas konsol dicetak dan dicatat) lalu pasang.
 * Gagal → /console/cashflow/masuk yang menjelaskan sebabnya dan menawarkan
 * coba lagi; halaman itu sendiri TIDAK memakai middleware ini.
 *
 * Hanya berjalan di klien: sesinya hidup di sessionStorage, dan klien
 * Supabase-nya dimuat malas di sini (useCashflowSupabase) — halaman publik
 * landing tidak pernah membayar pustakanya.
 *
 * Lolos di sini BELUM berarti boleh membaca data: is_platform_admin() di
 * setiap RPC yang memutuskan (sesi harus tercatat di admin_konsol_sesi).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/console/cashflow/masuk') return

  const sb = await useCashflowSupabase().ambil()
  if (!sb) {
    return navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'konfigurasi', ke: to.fullPath } })
  }

  const { data: { session } } = await sb.auth.getSession()
  if (session) return

  const hasil = await useCashflowSesi().sambung()
  if (!hasil.ok) {
    return navigateTo({ path: '/console/cashflow/masuk', query: { sebab: hasil.sebab, ke: to.fullPath } })
  }
})
