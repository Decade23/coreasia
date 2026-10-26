import { resolveLocaleFromQuery } from '~/utils/i18n'

export default defineNuxtPlugin((nuxtApp) => {
  const route = useRoute()
  const syncLocale = () => {
    const active = resolveLocaleFromQuery(route.query)
    // Keep the document language and the SEO module aligned. The dictionaries
    // themselves are resolved by useCoreI18n and are not serialized into payload.state.
    updateSiteConfig({ currentLocale: active === 'en' ? 'en-US' : 'id-ID' })
  }
  syncLocale()
  if (import.meta.client) nuxtApp.hook('page:finish', syncLocale)
})
