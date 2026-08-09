/**
 * Direct Google tag loader for the CoreAsia Ads account. It intentionally
 * shares window.dataLayer with the existing GTM plugin, so both integrations
 * can coexist without replacing or resetting queued events.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const conversionId = (config.public.googleAdsConversionId as string | undefined)?.trim()
  // useRouter().currentRoute, bukan useRoute(). Plugin berjalan sebelum router
  // sepenuhnya siap, dan plugin GTM di sebelahnya sudah memakai bentuk ini.
  const router = useRouter()
  const path = router.currentRoute.value.path

  if (
    !conversionId
    || path === '/console'
    || path.startsWith('/console/')
  ) {
    return
  }

  window.dataLayer = window.dataLayer || []
  // Bentuk shim WAJIB mendorong objek `arguments`, bukan array hasil rest
  // parameter. gtag.js mengenali perintahnya dari bentuk arguments; array biasa
  // tidak diproses sebagai perintah, sehingga `config` diabaikan dan konversi
  // TIDAK PERNAH tercatat tanpa satu pun pesan galat di console. Karena itu
  // fungsi biasa, bukan arrow function, sebab arrow tidak punya `arguments`.
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params -- kontrak gtag.js menuntut objek arguments
      ;(window.dataLayer as unknown[]).push(arguments)
    }
  }

  window.gtag('js', new Date())
  window.gtag('config', conversionId)

  useHead({
    script: [
      {
        key: 'coreasia-google-ads',
        src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(conversionId)}`,
        async: true,
      },
    ],
  })
})
