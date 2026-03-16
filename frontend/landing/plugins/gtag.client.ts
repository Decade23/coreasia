/**
 * GA4 (gtag.js) client-side plugin.
 * Loads the GA4 script, initializes gtag, and tracks SPA navigations.
 * Gracefully does nothing when measurement ID is not configured.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const id = config.public.gaMeasurementId as string

  if (!id) return

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  function gtag(...args: any[]) {
    window.dataLayer!.push(args)
  }
  window.gtag = gtag as any

  gtag('js', new Date())
  gtag('config', id, { send_page_view: true })

  // Load gtag.js script async
  useHead({
    script: [
      {
        src: `https://www.googletagmanager.com/gtag/js?id=${id}`,
        async: true,
      },
    ],
  })

  // Track SPA page navigations
  const router = useRouter()
  router.afterEach((to) => {
    gtag('config', id, {
      page_path: to.fullPath,
      page_title: typeof document !== 'undefined' ? document.title : '',
    })
  })
})
