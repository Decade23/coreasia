/**
 * Analytics composable for GTM dataLayer event tracking.
 * Pushes events to dataLayer which GTM picks up and routes
 * to GA4, Facebook Pixel, or any other tag configured in GTM.
 * Graceful fallback when GTM is blocked (ad-blockers, incognito).
 */

type EventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: any[]
  }
}

const pushEvent = (event: string, params?: EventParams) => {
  if (import.meta.server) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}

export const useAnalytics = () => {
  const trackEvent = (eventName: string, params?: EventParams) => {
    pushEvent(eventName, params)
  }

  const trackFormSubmit = (formName: string, extra?: EventParams) => {
    pushEvent('form_submit', {
      event_category: 'Lead Generation',
      form_name: formName,
      value: 1,
      ...extra,
    })
  }

  const trackFormStart = (formName: string) => {
    pushEvent('form_start', {
      event_category: 'Lead Generation',
      form_name: formName,
    })
  }

  const trackWhatsAppClick = (source: string) => {
    pushEvent('whatsapp_click', {
      event_category: 'Contact',
      event_label: source,
    })
  }

  const trackCTAClick = (buttonName: string, destination?: string) => {
    pushEvent('cta_click', {
      event_category: 'Engagement',
      button_name: buttonName,
      destination: destination || '',
    })
  }

  const trackOutboundClick = (url: string, label?: string) => {
    pushEvent('outbound_click', {
      event_category: 'Outbound',
      event_label: label || url,
      link_url: url,
    })
  }

  const trackView = (itemName: string, extra?: EventParams) => {
    pushEvent('view_item', {
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
