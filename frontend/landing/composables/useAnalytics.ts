/**
 * Analytics composable for GTM dataLayer event tracking.
 * Pushes events to dataLayer which GTM picks up and routes
 * to GA4, Facebook Pixel, or any other tag configured in GTM.
 * Graceful fallback when GTM is blocked (ad-blockers, incognito).
 */

type EventValue = string | number | boolean | undefined | null
type EventParams = Record<string, EventValue>

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

const pushEvent = (event: string, params: EventParams = {}) => {
  if (import.meta.server) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}

const resolvePageContext = (): EventParams => {
  if (import.meta.server) {
    return {}
  }

  return {
    page_title: typeof document !== 'undefined' ? document.title : '',
    page_location: window.location.href,
  }
}

export const useAnalytics = () => {
  const trackEvent = (eventName: string, params?: EventParams) => {
    pushEvent(eventName, params)
  }

  const trackPageView = (path: string, extra?: EventParams) => {
    pushEvent('page_view', {
      page_path: path,
      ...resolvePageContext(),
      ...extra,
    })
  }

  const trackFormSubmit = (formName: string, extra?: EventParams) => {
    pushEvent('form_submit', {
      event_category: 'Lead Generation',
      form_name: formName,
      value: 1,
      ...extra,
    })
  }

  const trackFormStart = (formName: string, extra?: EventParams) => {
    pushEvent('form_start', {
      event_category: 'Lead Generation',
      form_name: formName,
      ...extra,
    })
  }

  const trackWhatsAppClick = (source: string, extra?: EventParams) => {
    pushEvent('whatsapp_click', {
      event_category: 'Contact',
      event_label: source,
      ...extra,
    })
  }

  const trackCTAClick = (buttonName: string, destination?: string, extra?: EventParams) => {
    pushEvent('cta_click', {
      event_category: 'Engagement',
      button_name: buttonName,
      destination: destination || '',
      ...extra,
    })
  }

  const trackOutboundClick = (url: string, label?: string, extra?: EventParams) => {
    pushEvent('outbound_click', {
      event_category: 'Outbound',
      event_label: label || url,
      link_url: url,
      ...extra,
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
    trackPageView,
    trackFormSubmit,
    trackFormStart,
    trackWhatsAppClick,
    trackCTAClick,
    trackOutboundClick,
    trackView,
  }
}