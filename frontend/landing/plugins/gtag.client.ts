import { CONSENT_EVENT, readPublicConsent, updateGoogleConsent } from '~/utils/public-consent'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const id = (config.public.gtmId as string | undefined)?.trim()
  if (!id) return
  const router = useRouter()
  const isConsolePath = jalurKonsol
  if (isConsolePath(router.currentRoute.value.path) || isConsolePath(window.location.pathname)) return
  const { trackPageView } = useAnalytics()
  const head = useHead({ script: [] })
  let started = false
  let lastTrackedLocation = ''
  let previousPageLocation = referrerAnalitik(document.referrer)
  const trackCurrentPage = () => {
    const routePath = router.currentRoute.value.path || '/'
    const currentLocation = window.location.href
    if (!readPublicConsent().analytics || isConsolePath(routePath) || currentLocation === lastTrackedLocation) return
    trackPageView(routePath, { page_referrer: previousPageLocation, page_locale: document.documentElement.lang || '' })
    previousPageLocation = currentLocation
    lastTrackedLocation = currentLocation
  }
  const start = () => {
    if (!readPublicConsent().analytics) return
    updateGoogleConsent()
    if (!started) {
      window.dataLayer ||= []
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
      head.patch({ script: [{ key: 'coreasia-gtm', src: `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`, async: true }] })
      started = true
    }
    window.requestAnimationFrame(trackCurrentPage)
  }
  start()
  window.addEventListener(CONSENT_EVENT, start)
  nuxtApp.hook('page:finish', () => window.requestAnimationFrame(trackCurrentPage))
  nuxtApp.vueApp?.onUnmount(() => window.removeEventListener(CONSENT_EVENT, start))
})
