/**
 * Admin authentication composable.
 * Manages login/logout, token cookies, and current user state.
 */

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

export const useAdminAuth = () => {
  const api = useAdminApi()
  const token = useCookie('auth_admin_token', { path: '/' })
  const refreshToken = useCookie('refresh_admin_token', { path: '/' })

  const user = useState<AdminUser | null>('admin_user', () => null)
  const loginError = ref('')
  const pending = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const login = async (email: string, password: string): Promise<boolean> => {
    loginError.value = ''
    pending.value = true
    try {
      const res = await api.post<{
        access_token: string
        refresh_token: string
        expires_at: string
        user: AdminUser
      }>('/admin/auth/login', { email, password })

      if (res.errors) {
        loginError.value = res.errors.message
        return false
      }

      token.value = res.data.access_token
      refreshToken.value = res.data.refresh_token
      user.value = res.data.user
      return true
    } catch (err: any) {
      loginError.value = err?.data?.errors?.message || 'Login gagal. Periksa email dan password.'
      return false
    } finally {
      pending.value = false
    }
  }

  const fetchMe = async (): Promise<boolean> => {
    if (!token.value) return false
    try {
      const res = await api.get<AdminUser>('/admin/auth/me')
      if (res.data) {
        user.value = res.data
        return true
      }
      return false
    } catch {
      token.value = null
      refreshToken.value = null
      user.value = null
      return false
    }
  }

  const logout = async () => {
    try {
      await api.post('/admin/auth/logout')
    } catch { /* ignore */ }
    token.value = null
    refreshToken.value = null
    user.value = null
    navigateTo('/admin/login')
  }

  return { user, token, isAuthenticated, loginError, pending, login, fetchMe, logout }
}
