/**
 * Google Tag Manager (GTM) client-side plugin.
 * Loads the GTM container script and tracks SPA navigations via dataLayer.
 * Gracefully does nothing when GTM ID is not configured.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const id = config.public.gtmId as string

  if (!id) return

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  })

  // Load GTM script async
  useHead({
    script: [
      {
        src: `https://www.googletagmanager.com/gtm.js?id=${id}`,
        async: true,
      },
    ],
    noscript: [
      {
        innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
      },
    ],
  })

  // Track SPA page navigations
  const router = useRouter()
  router.afterEach((to) => {
    window.dataLayer?.push({
      event: 'page_view',
      page_path: to.fullPath,
      page_title: typeof document !== 'undefined' ? document.title : '',
    })
  })
})
