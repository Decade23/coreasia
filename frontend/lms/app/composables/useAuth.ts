import { coreApi } from '~/services/api/CoreApiService'
import type { LoginResponseDTO, UserResponseDTO, TokenResponseDTO, AuthUser } from '~/types/auth'
import { AuthAdapter } from '~/adapters/AuthAdapter'
import type { UserDomain } from '~/adapters/UserAdapter'

export const useAuth = () => {
    const token = useCookie<string | null>('auth_token', { maxAge: 60 * 60 * 24 * 7 })
    const refreshTokenCookie = useCookie<string | null>('refresh_token', { maxAge: 60 * 60 * 24 * 30 })
    const userSession = useCookie<UserDomain | null>('user_session', { maxAge: 60 * 60 * 24 * 7 })
    const config = useRuntimeConfig()
    const tenantSlug = config.public.tenantSlug as string

    const user = ref<AuthUser | null>(null)
    const pending = ref(false)
    const error = ref<string | null>(null)
    const loginError = ref<string | null>(null)

    // Restore user from session cookie on init
    if (userSession.value && token.value) {
        user.value = sessionToAuthUser(userSession.value)
    }

    const fetchCurrentUser = async () => {
        if (!token.value) return
        try {
            const dto = await coreApi.get<UserResponseDTO>('/auth/me')
            applyUser(dto)
        } catch (e: unknown) {
            const err = e as { data?: { message?: string }; message?: string }
            console.warn('[useAuth] Failed to fetch user:', err?.data?.message || err?.message)
            await tryRefreshToken()
        }
    }

    const tryRefreshToken = async () => {
        if (!refreshTokenCookie.value) {
            clearSession()
            return
        }
        try {
            const result = await coreApi.post<TokenResponseDTO>('/auth/refresh', {
                refresh_token: refreshTokenCookie.value,
            })
            token.value = result.access_token
            refreshTokenCookie.value = result.refresh_token
            await fetchCurrentUser()
        } catch {
            clearSession()
        }
    }

    const login = async (email: string, password: string) => {
        pending.value = true
        loginError.value = null
        try {
            const result = await coreApi.post<LoginResponseDTO>('/auth/login', { email, password })

            token.value = result.access_token
            refreshTokenCookie.value = result.refresh_token
            applyUser(result.user)

            // Navigate based on role
            const role = user.value?.role
            if (role === 'admin' || role === 'super_admin') navigateTo('/admin')
            else if (role === 'quality_manager') navigateTo('/admin/quality')
            else if (role === 'assessor') navigateTo('/assessor')
            else if (role === 'assessee') navigateTo('/assessee')
            else navigateTo('/')
        } catch (e: unknown) {
            const err = e as { data?: { message?: string }; message?: string }
            loginError.value = err?.data?.message || err?.message || 'Gagal login. Periksa kembali email dan kata sandi.'
        } finally {
            pending.value = false
        }
    }

    const logout = async () => {
        try {
            if (token.value) await coreApi.post('/auth/logout')
        } catch {
            // Ignore — server may have already invalidated
        } finally {
            clearSession()
            navigateTo('/login')
        }
    }

    function applyUser(dto: UserResponseDTO) {
        const authUser = AuthAdapter.toDomain(dto, tenantSlug)
        user.value = authUser

        const domain: UserDomain = {
            id: authUser.id,
            email: authUser.email,
            fullName: authUser.fullName,
            phoneNumber: '',
            role: authUser.role,
            tenantId: authUser.tenantId,
            isActive: authUser.isActive,
            lastLoginAt: authUser.lastLogin ?? null,
        }
        userSession.value = domain

        const authStore = useAuthStore()
        authStore.setAuth(domain, token.value!)
    }

    function clearSession() {
        token.value = null
        refreshTokenCookie.value = null
        user.value = null
        userSession.value = null
        const authStore = useAuthStore()
        authStore.clearAuth()
    }

    function sessionToAuthUser(s: UserDomain): AuthUser {
        return {
            id: s.id,
            email: s.email,
            fullName: s.fullName,
            role: s.role,
            tenantId: s.tenantId,
            isActive: s.isActive,
            lastLogin: s.lastLoginAt ? new Date(s.lastLoginAt as unknown as string) : undefined,
        }
    }

    return {
        user,
        pending,
        error,
        loginError,
        refresh: fetchCurrentUser,
        login,
        logout,
    }
}
