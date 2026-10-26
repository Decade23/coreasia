export default defineNuxtRouteMiddleware((to) => {
    if ((Array.isArray(to.query.lang) ? to.query.lang[0] : to.query.lang) === 'en')
        return navigateTo(
            { path: to.path, query: { ...to.query, lang: 'id' }, hash: to.hash },
            { redirectCode: 302, replace: true },
        )
})
