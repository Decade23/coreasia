/**
 * Penjaga rute console. Dipasang lewat definePageMeta({ middleware: 'console' }).
 *
 * Cookie sesi console sekarang HttpOnly (BFF Nitro, Fase 0c), jadi JS tidak
 * bisa lagi memeriksa keberadaannya. Keputusan ada di gateway: /me lewat
 * proxy /api/gw (yang me-refresh sendiri bila access token habis). Gagal →
 * /console/login, dengan tujuan semula di `ke`.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchMe } = useAdminAuth()

  if (!user.value) {
    const ok = await fetchMe()
    if (!ok) {
      return navigateTo({ path: '/console/login', query: to.fullPath !== '/console' ? { ke: to.fullPath } : {} })
    }
  }
})
