const sentLeadConversions = new Set<string>()

export const useGoogleAdsConversion = () => {
  const config = useRuntimeConfig()

  const trackLeadConversion = (leadId: string): boolean => {
    if (import.meta.server || !leadId || sentLeadConversions.has(leadId)) {
      return false
    }

    const conversionId = (config.public.googleAdsConversionId as string | undefined)?.trim()
    const conversionLabel = (config.public.googleAdsLeadConversionLabel as string | undefined)?.trim()
    if (!conversionId || !conversionLabel || typeof window.gtag !== 'function') {
      return false
    }

    window.gtag('event', 'conversion', {
      send_to: `${conversionId}/${conversionLabel}`,
      value: 1,
      currency: 'IDR',
      transaction_id: leadId,
    })
    sentLeadConversions.add(leadId)

    return true
  }

  return { trackLeadConversion }
}
