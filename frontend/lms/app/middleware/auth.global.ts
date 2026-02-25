// ----------------------------------------------------------------------------
// app/middleware/auth.global.ts
//
// This middleware runs on every route change (SSR + Client).
// Validates Authentication Token and enforces basic Role-Based Access Control (RBAC).
// ----------------------------------------------------------------------------
import type { UserDomain } from '~/adapters/UserAdapter'

export default defineNuxtRouteMiddleware((to, from) => {
    // 1. Identify public routes (No JWT required)
    const publicRoutes = ['/login', '/register', '/forgot-password', '/sandbox', '/verify']

    // Exclude error pages from strict routing
    if (to.path.startsWith('/_nuxt') || to.path === '/error') return

    // Check if current route is public by allowing prefix matching
    const isPublicRoute = publicRoutes.some(route => to.path === route || to.path.startsWith(`${route}/`))

    const authToken = useCookie('auth_token').value
    // In a real app, `userSession` would be fetched from a central store like Pinia
    const userSession = useCookie<UserDomain | null>('user_session').value

    // 2. Auth Logic
    if (!authToken && !isPublicRoute) {
        console.warn(`[Auth Guard] Unauthenticated access to ${to.path}. Redirecting to /login.`)
        return navigateTo('/login')
    }

    if (authToken && isPublicRoute && to.path === '/login') {
        console.info(`[Auth Guard] Already authenticated. Redirecting away from /login.`)
        // Determine redirect based on role
        return navigateTo(resolveDashboard(userSession?.role))
    }

    // 3. Simple RBAC Enforcement
    if (authToken && userSession) {
        const role = userSession.role

        // Assessee constraints
        if (role === 'assessee') {
            if (to.path.startsWith('/admin') || to.path.startsWith('/assessor')) {
                return navigateTo('/error') // Or a 403 Forbidden page
            }
        }

        // Assessor constraints
        if (role === 'assessor') {
            if (to.path.startsWith('/admin') || to.path.startsWith('/assessee')) {
                return navigateTo('/error')
            }
        }

        // Quality Manager — can access /admin/quality, /admin/verifications, and /admin/settings
        if (role === 'quality_manager') {
            if (to.path.startsWith('/assessee') || to.path.startsWith('/assessor') || to.path.startsWith('/cbt')) {
                return navigateTo('/admin/quality')
            }
            const allowedAdminPaths = ['/admin/quality', '/admin/verifications', '/admin/settings']
            if (to.path.startsWith('/admin') && !allowedAdminPaths.some(p => to.path.startsWith(p))) {
                return navigateTo('/admin/quality')
            }
        }

        // Admin constraints
        if (role === 'admin' || role === 'super_admin') {
            if (to.path.startsWith('/assessee') || to.path.startsWith('/assessor')) {
                return navigateTo('/admin')
            }
        }
    }
})

/**
 * Resolves the primary dashboard route based on User Role
 */
function resolveDashboard(role?: UserDomain['role']): string {
    switch (role) {
        case 'admin':
        case 'super_admin':
            return '/admin'
        case 'quality_manager':
            return '/admin/quality'
        case 'assessor':
            return '/assessor'
        case 'assessee':
        default:
            return '/assessee'
    }
}
