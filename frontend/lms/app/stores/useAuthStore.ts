import { defineStore } from 'pinia'
import type { UserDomain } from '~/adapters/UserAdapter'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserDomain | null>(null)
    const token = ref<string | null>(null)
    const isAuthenticated = computed(() => !!token.value)

    const setAuth = (userData: UserDomain, authToken: string) => {
        user.value = userData
        token.value = authToken
    }

    const clearAuth = () => {
        user.value = null
        token.value = null
    }

    const hasRole = (role: UserDomain['role']) => {
        return user.value?.role === role
    }

    const isAdmin = computed(() =>
        user.value?.role === 'admin' || user.value?.role === 'super_admin'
    )

    return {
        user,
        token,
        isAuthenticated,
        isAdmin,
        setAuth,
        clearAuth,
        hasRole,
    }
})
