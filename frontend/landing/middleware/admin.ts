/**
 * Admin route guard middleware.
 * Redirects to /admin/login if not authenticated.
 * Applied via definePageMeta({ middleware: 'admin' }) on admin pages.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie('auth_admin_token')

  if (!token.value) {
    return navigateTo('/admin/login')
  }

  const { user, fetchMe } = useAdminAuth()

  if (!user.value) {
    const ok = await fetchMe()
    if (!ok) {
      return navigateTo('/admin/login')
    }
  }
})
