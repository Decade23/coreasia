import type { AuthUserDTO } from '~/types/auth'

export const useAuth = () => {
    // Cookie to store token
    const token = useCookie<string | null>('auth_token', { maxAge: 60 * 60 * 24 * 7 }) // 1 week

    // Fetch profile if token exists. Since this runs on init, it restores session
    const { data: user, pending, error, refresh } = useFetch<AuthUserDTO | null>('/api/auth/me', {
        headers: useRequestHeaders(['cookie']),
        immediate: !!token.value,
        // Provide a mock response for now to enable Frontend Dev
        transform: (res: any): AuthUserDTO | null => {
            if (res && res.id) return res as AuthUserDTO;
            // Fallback Mock based on token value during dev
            if (token.value === 'mock-assessee-token') {
                return { id: 'u-1', name: 'Budi (Asesi)', email: 'budi@test.com', role: 'assessee', tenant_id: 't-1', is_active: true } as AuthUserDTO
            }
            if (token.value === 'mock-admin-token') {
                return { id: 'u-2', name: 'Admin LSP', email: 'admin@lsp.com', role: 'admin', tenant_id: 't-1', is_active: true } as AuthUserDTO
            }
            return null;
        }
    })

    const login = async (email: string, pass: string) => {
        pending.value = true
        error.value = undefined as any
        try {
            // Mock API Delay
            await new Promise(resolve => setTimeout(resolve, 800))

            // Set mock token based on email for testing
            if (email.includes('admin')) {
                token.value = 'mock-admin-token'
            } else {
                token.value = 'mock-assessee-token'
            }

            // Trigger fetch to populate 'user' ref
            await refresh()

            // Navigate to appropriately based on new role
            if (user.value?.role === 'admin') navigateTo('/admin')
            else if (user.value?.role === 'assessee') navigateTo('/assessee')
            else navigateTo('/')

        } catch (e: any) {
            error.value = e
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
        refresh,
        login,
        logout
    }
}
