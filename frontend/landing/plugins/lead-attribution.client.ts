/**
 * Capture the latest tagged campaign arrival before a visitor moves to another
 * page and loses the UTM/click identifiers. Direct visits preserve the most
 * recent tagged touch instead of overwriting it.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { captureAttribution } = useLeadAttribution()
  captureAttribution()
  nuxtApp.hook('page:finish', () => {
    captureAttribution()
  })
})
