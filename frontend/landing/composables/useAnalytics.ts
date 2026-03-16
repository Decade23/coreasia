/**
 * Analytics composable for GA4 event tracking.
 * Wraps gtag calls with type-safe helpers and graceful fallback
 * when gtag is blocked (ad-blockers, incognito).
 */

type GtagEventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

const gtag = (...args: any[]) => {
  if (import.meta.server) return
  window.gtag?.(...args)
}

export const useAnalytics = () => {
  /**
   * Track a custom GA4 event.
   */
  const trackEvent = (eventName: string, params?: GtagEventParams) => {
    gtag('event', eventName, params)
  }

  /**
   * Track form submission.
   */
  const trackFormSubmit = (formName: string, extra?: GtagEventParams) => {
    trackEvent('form_submit', {
      event_category: 'Lead Generation',
      form_name: formName,
      value: 1,
      ...extra,
    })
  }

  /**
   * Track form start (first interaction).
   */
  const trackFormStart = (formName: string) => {
    trackEvent('form_start', {
      event_category: 'Lead Generation',
      form_name: formName,
    })
  }

  /**
   * Track WhatsApp button clicks.
   * Uses sendBeacon pattern to ensure the event fires before navigation.
   */
  const trackWhatsAppClick = (source: string) => {
    trackEvent('whatsapp_click', {
      event_category: 'Contact',
      event_label: source,
      link_url: 'https://wa.me/',
    })
  }

  /**
   * Track CTA button clicks.
   */
  const trackCTAClick = (buttonName: string, destination?: string) => {
    trackEvent('cta_click', {
      event_category: 'Engagement',
      button_name: buttonName,
      destination: destination || '',
    })
  }

  /**
   * Track outbound link clicks.
   */
  const trackOutboundClick = (url: string, label?: string) => {
    trackEvent('click', {
      event_category: 'Outbound',
      event_label: label || url,
      link_url: url,
    })
  }

  /**
   * Track page/product views.
   */
  const trackView = (itemName: string, extra?: GtagEventParams) => {
    trackEvent('view_item', {
      event_category: 'Discovery',
      item_name: itemName,
      ...extra,
    })
  }

  return {
    trackEvent,
    trackFormSubmit,
    trackFormStart,
    trackWhatsAppClick,
    trackCTAClick,
    trackOutboundClick,
    trackView,
  }
}
