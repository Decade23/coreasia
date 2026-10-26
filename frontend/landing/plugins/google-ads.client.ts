import { CONSENT_EVENT, readPublicConsent, updateGoogleConsent } from '~/utils/public-consent'
export default defineNuxtPlugin(nuxtApp => {
  const config = useRuntimeConfig()
  const conversionId = (config.public.googleAdsConversionId as string | undefined)?.trim()
  const router = useRouter()
  if (!conversionId || jalurKonsol(router.currentRoute.value.path) || jalurKonsol(window.location.pathname)) return
  const head = useHead({ script: [] })
  let started = false
  const start = () => {
    if (!readPublicConsent().ads) return
    updateGoogleConsent()
    if (started) return
    window.gtag?.('js', new Date())
    window.gtag?.('config', conversionId, { send_page_view: false })
    head.patch({ script: [{ key: 'coreasia-google-ads', src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(conversionId)}`, async: true }] })
    started = true
  }
  start()
  window.addEventListener(CONSENT_EVENT, start)
  nuxtApp.vueApp?.onUnmount(() => window.removeEventListener(CONSENT_EVENT, start))
})
