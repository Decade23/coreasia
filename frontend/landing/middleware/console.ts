/**
 * Admin route guard middleware.
 * Redirects to /console/login if not authenticated.
 * Applied via definePageMeta({ middleware: 'console' }) on console pages.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie('auth_admin_token')

  if (!token.value) {
    return navigateTo('/console/login')
  }

  const { user, fetchMe } = useAdminAuth()

  if (!user.value) {
    const ok = await fetchMe()
    if (!ok) {
      return navigateTo('/console/login')
    }
  }
})
