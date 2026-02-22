export default defineNuxtRouteMiddleware(async (to, from) => {
    const token = useCookie('auth_token')

    // 1. If user is NOT logged in and trying to access protected route -> redirect to /login
    if (!token.value && to.path !== '/login' && to.path !== '/register') {
        return navigateTo('/login')
    }

    // 2. If user IS logged in and trying to access /login or /register -> redirect to appropriate dashboard
    if (token.value && (to.path === '/login' || to.path === '/register')) {
        // Basic routing logic based on token
        if (token.value.includes('admin')) {
            return navigateTo('/admin')
        }
        return navigateTo('/assessee')
    }

    // Allow navigation for everything else
})
