const WHATSAPP_HOSTS = new Set([
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'www.whatsapp.com',
])

const isTrackableCta = (anchor: HTMLAnchorElement) => {
  if (anchor.dataset.analyticsIgnore === 'true') {
    return false
  }

  if ((anchor.dataset.analyticsLabel || '').trim()) {
    return true
  }

  const classNames = anchor.className.split(/\s+/)
  return classNames.some((className) => className.startsWith('ca-btn')) || classNames.includes('ca-link-accent')
}

const resolveCtaLabel = (anchor: HTMLAnchorElement) => {
  const raw =
    anchor.dataset.analyticsLabel?.trim()
    || anchor.getAttribute('aria-label')?.trim()
    || anchor.getAttribute('title')?.trim()
    || anchor.textContent?.replace(/\s+/g, ' ').trim()
    || anchor.href

  return raw.slice(0, 80)
}

export default defineNuxtPlugin(() => {
  const route = useRoute()
  const { trackCTAClick, trackOutboundClick, trackWhatsAppClick } = useAnalytics()

  const handleClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || !(event.target instanceof Element)
    ) {
      return
    }

    const anchor = event.target.closest('a[href]')
    if (!(anchor instanceof HTMLAnchorElement) || !isTrackableCta(anchor)) {
      return
    }

    const rawHref = anchor.getAttribute('href')
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) {
      return
    }

    let url: URL
    try {
      url = new URL(anchor.href, window.location.origin)
    } catch {
      return
    }

    const ctaText = resolveCtaLabel(anchor)
    const sourcePath = route.fullPath || '/'

    if (WHATSAPP_HOSTS.has(url.hostname)) {
      trackWhatsAppClick(ctaText, {
        source_path: sourcePath,
        cta_text: ctaText,
        destination: url.href,
      })
      return
    }

    if (url.protocol === 'mailto:') {
      trackOutboundClick(url.href, ctaText, {
        source_path: sourcePath,
        cta_text: ctaText,
      })
      return
    }

    if (url.origin !== window.location.origin) {
      return
    }

    if (url.pathname === '/contact') {
      trackCTAClick(ctaText || 'contact_cta', `${url.pathname}${url.search}`, {
        source_path: sourcePath,
        cta_text: ctaText,
        subject: url.searchParams.get('subject') || undefined,
        plan: url.searchParams.get('plan') || undefined,
      })
      return
    }

    if (url.pathname === '/register') {
      trackCTAClick(ctaText || 'register_cta', `${url.pathname}${url.search}`, {
        source_path: sourcePath,
        cta_text: ctaText,
        plan: url.searchParams.get('plan') || undefined,
      })
      return
    }

    if (url.pathname === '/pricing') {
      trackCTAClick(ctaText || 'pricing_cta', `${url.pathname}${url.search}`, {
        source_path: sourcePath,
        cta_text: ctaText,
      })
    }
  }

  window.addEventListener('click', handleClick, true)
})