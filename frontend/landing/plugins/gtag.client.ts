/**
 * Google Tag Manager (GTM) client-side plugin.
 * Loads the GTM container script and pushes initial + SPA page views to dataLayer.
 * Gracefully does nothing when GTM ID is not configured.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const id = (config.public.gtmId as string | undefined)?.trim()

  if (!id) return

  const router = useRouter()
  // jalurKonsol (utils/konsol.ts) tidak peka huruf/encoding: vue-router juga
  // tidak, jadi /Console/login tetap halaman login console.
  const isConsolePath = jalurKonsol

  if (isConsolePath(router.currentRoute.value.path) || isConsolePath(window.location.pathname)) {
    return
  }

  const { trackPageView } = useAnalytics()

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    'gtm.start': Date.now(),
    event: 'gtm.js',
  })

  useHead({
    script: [
      {
        key: 'coreasia-gtm',
        src: `https://www.googletagmanager.com/gtm.js?id=${id}`,
        async: true,
      },
    ],
  })

  let lastTrackedLocation = ''
  // Referrer dari console (UUID subjek, saringan) tidak dikirim ke GA — utils/konsol.ts referrerAnalitik (temuan F7).
  let previousPageLocation = referrerAnalitik(document.referrer)

  const trackCurrentPage = () => {
    const currentPath = router.currentRoute.value.fullPath || '/'
    const routePath = router.currentRoute.value.path || '/'
    const currentLocation = window.location.href

    if (isConsolePath(routePath) || !currentLocation || currentLocation === lastTrackedLocation) {
      return
    }

    trackPageView(currentPath, {
      page_location: currentLocation,
      page_referrer: previousPageLocation,
      page_locale: document.documentElement.lang || '',
    })

    previousPageLocation = currentLocation
    lastTrackedLocation = currentLocation
  }

  const scheduleTrackCurrentPage = () => {
    window.requestAnimationFrame(() => {
      trackCurrentPage()
    })
  }

  scheduleTrackCurrentPage()
  nuxtApp.hook('page:finish', scheduleTrackCurrentPage)
})
