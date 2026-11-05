export default defineNuxtRouteMiddleware(() => {
 if (!usePermissions().can('leadku:view')) return navigateTo('/console')
})
