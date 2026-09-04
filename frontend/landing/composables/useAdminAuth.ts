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
  const { tc } = useConsoleI18n()
  /* Cookie dipasang dari JS (gateway memulangkan token di badan jawaban), jadi
     HttpOnly mustahil dari sini. Yang bisa: SameSite=Lax supaya cookie tidak
     ikut permintaan lintas situs yang dipicu halaman lain, dan Secure di
     saat halaman disajikan lewat https. Di http (dev, `nuxt preview` lokal)
     peramban membuang cookie Secure, jadi ia mengikuti protokol yang dipakai. */
  const aman = import.meta.client ? window.location.protocol === 'https:' : !import.meta.dev
  const opsiCookie = { path: '/', sameSite: 'lax' as const, secure: aman }
  const token = useCookie('auth_admin_token', opsiCookie)
  const refreshToken = useCookie('refresh_admin_token', opsiCookie)

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
      loginError.value = err?.data?.errors?.message || tc('feedback.loginFailed')
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
    // Sesi modul CashFlow (Supabase) ikut dicabut di server — tanpa ini token
    // di sessionStorage tetap hidup sampai tab ditutup walau console sudah keluar.
    try {
      await useCashflowSesi().keluar()
    } catch { /* modul tidak terkonfigurasi atau sudah tidak ada sesi */ }
    try {
      await api.post('/admin/auth/logout')
    } catch { /* ignore */ }
    token.value = null
    refreshToken.value = null
    user.value = null
    navigateTo('/console/login')
  }

  return { user, token, isAuthenticated, loginError, pending, login, fetchMe, logout }
}
