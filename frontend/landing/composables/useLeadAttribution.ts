export interface LeadAttribution {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term: string
  utm_content: string
  gclid: string
  fbclid: string
  landing_page: string
  referrer: string
}

interface StoredLeadAttribution {
  attribution: LeadAttribution
  expires_at: number
}

const STORAGE_KEY = 'coreasia_lead_attribution_v2'
const ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000
const ATTRIBUTION_VALUE_MAX_LENGTH = 255
const CLICK_ID_MAX_LENGTH = 512
const URL_VALUE_MAX_LENGTH = 2048

let memoryAttribution: StoredLeadAttribution | null = null

const truncate = (value: string | null | undefined, maxLength: number) =>
  (value || '').trim().slice(0, maxLength)

const isLeadAttribution = (value: unknown): value is LeadAttribution => {
  if (!value || typeof value !== 'object') return false

  const attribution = value as Record<string, unknown>
  return [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
    'landing_page',
    'referrer',
  ].every((key) => typeof attribution[key] === 'string')
}

const readStoredAttribution = (): StoredLeadAttribution | null => {
  if (import.meta.server) return null

  if (memoryAttribution && memoryAttribution.expires_at > Date.now()) {
    return memoryAttribution
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const stored = JSON.parse(raw) as Partial<StoredLeadAttribution>
    if (
      typeof stored.expires_at !== 'number'
      || stored.expires_at <= Date.now()
      || !isLeadAttribution(stored.attribution)
    ) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    memoryAttribution = stored as StoredLeadAttribution
    return memoryAttribution
  } catch {
    return null
  }
}

const writeStoredAttribution = (stored: StoredLeadAttribution) => {
  memoryAttribution = stored

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // Private browsing or a strict browser policy may disable localStorage.
    // The in-memory value still preserves attribution during this SPA session.
  }
}

const attributionFromCurrentPage = () => {
  const url = new URL(window.location.href)
  const query = new Map<string, string>()

  url.searchParams.forEach((value, key) => {
    query.set(key.toLowerCase(), value)
  })

  const landingUrl = new URL(url.pathname, url.origin)
  for (const key of [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
  ]) {
    const value = query.get(key)
    if (value) landingUrl.searchParams.set(key, value)
  }

  const attribution: LeadAttribution = {
    utm_source: truncate(query.get('utm_source'), ATTRIBUTION_VALUE_MAX_LENGTH),
    utm_medium: truncate(query.get('utm_medium'), ATTRIBUTION_VALUE_MAX_LENGTH),
    utm_campaign: truncate(query.get('utm_campaign'), ATTRIBUTION_VALUE_MAX_LENGTH),
    utm_term: truncate(query.get('utm_term'), ATTRIBUTION_VALUE_MAX_LENGTH),
    utm_content: truncate(query.get('utm_content'), ATTRIBUTION_VALUE_MAX_LENGTH),
    gclid: truncate(query.get('gclid'), CLICK_ID_MAX_LENGTH),
    fbclid: truncate(query.get('fbclid'), CLICK_ID_MAX_LENGTH),
    // Keep only known attribution parameters in the landing URL. This preserves
    // ad context without persisting unrelated or potentially sensitive queries.
    landing_page: truncate(landingUrl.toString(), URL_VALUE_MAX_LENGTH),
    referrer: truncate(document.referrer, URL_VALUE_MAX_LENGTH),
  }

  const isTaggedTouch = [
    attribution.utm_source,
    attribution.utm_medium,
    attribution.utm_campaign,
    attribution.utm_term,
    attribution.utm_content,
    attribution.gclid,
    attribution.fbclid,
  ].some(Boolean)

  return { attribution, isTaggedTouch }
}

export const useLeadAttribution = () => {
  /**
   * Keep the latest tagged campaign touch. A tagged arrival replaces an older
   * record, while direct navigation only creates a record when none exists and
   * never erases the click ID needed for Google/Meta conversion attribution.
   */
  const captureAttribution = (): LeadAttribution | null => {
    if (import.meta.server) return null

    const existing = readStoredAttribution()
    const current = attributionFromCurrentPage()

    if (existing && !current.isTaggedTouch) return existing.attribution

    const stored: StoredLeadAttribution = {
      attribution: current.attribution,
      expires_at: Date.now() + ATTRIBUTION_TTL_MS,
    }
    writeStoredAttribution(stored)

    return stored.attribution
  }

  const getAttribution = (): LeadAttribution | null => {
    if (import.meta.server) return null
    return captureAttribution()
  }

  return {
    captureAttribution,
    getAttribution,
  }
}
