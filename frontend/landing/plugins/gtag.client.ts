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
  const isConsolePath = (path: string) => path === '/console' || path.startsWith('/console/')

  if (isConsolePath(router.currentRoute.value.path)) {
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
  let previousPageLocation = document.referrer || ''

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
