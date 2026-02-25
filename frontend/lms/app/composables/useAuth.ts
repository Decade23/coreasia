import type { AuthUserDTO } from '~/types/auth'

export const useAuth = () => {
    const token = useCookie<string | null>('auth_token', { maxAge: 60 * 60 * 24 * 7 })

    const { data: user, pending, error, refresh } = useFetch<AuthUserDTO | null>('/api/auth/me', {
        headers: useRequestHeaders(['cookie']),
        immediate: !!token.value,
        transform: (res: any): AuthUserDTO | null => {
            if (res && res.id) return res as AuthUserDTO
            if (token.value === 'mock-assessee-token') {
                return { id: 'u-1', name: 'Budi (Asesi)', email: 'budi@test.com', role: 'assessee', tenant_id: 't-1', is_active: true } as AuthUserDTO
            }
            if (token.value === 'mock-admin-token') {
                return { id: 'u-2', name: 'Admin LSP', email: 'admin@lsp.com', role: 'admin', tenant_id: 't-1', is_active: true } as AuthUserDTO
            }
            if (token.value === 'mock-assessor-token') {
                return { id: 'u-3', name: 'Asesor Utama', email: 'asesor@lsp.com', role: 'assessor', tenant_id: 't-1', is_active: true } as AuthUserDTO
            }
            return null
        },
    })

    const loginError = ref<string | null>(null)

    const login = async (email: string, pass: string) => {
        pending.value = true
        loginError.value = null
        try {
            // Mock login — replace with coreApi.post('/auth/login', { email, password: pass }) when backend ready
            await new Promise(resolve => setTimeout(resolve, 800))

            if (email.includes('admin')) {
                token.value = 'mock-admin-token'
            } else if (email.includes('asesor') || email.includes('assessor')) {
                token.value = 'mock-assessor-token'
            } else {
                token.value = 'mock-assessee-token'
            }

            await refresh()

            const role = user.value?.role
            if (role === 'admin' || role === 'super_admin') navigateTo('/admin')
            else if (role === 'assessor') navigateTo('/assessor')
            else if (role === 'assessee') navigateTo('/assessee')
            else navigateTo('/')
        } catch (e: any) {
            loginError.value = e?.data?.message || e?.message || 'Gagal login. Periksa kembali email dan kata sandi.'
        } finally {
            pending.value = false
        }
    }

    const logout = () => {
        token.value = null
        user.value = null
        navigateTo('/login')
    }

    return {
        user,
        pending,
        error,
        loginError,
        refresh,
        login,
        logout,
    }
}
