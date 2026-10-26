export const CONSENT_COOKIE = 'coreasia-consent'
export const CONSENT_EVENT = 'coreasia:consent'
export interface PublicConsent {
    analytics: boolean
    ads: boolean
    decided: boolean
}
export const parsePublicConsent = (value?: string): PublicConsent => {
    const match = /^v1\.a([01])\.m([01])$/.exec(value || '')
    return { analytics: match?.[1] === '1', ads: match?.[2] === '1', decided: !!match }
}
export const readPublicConsent = (): PublicConsent => {
    if (typeof document === 'undefined') return parsePublicConsent()
    return parsePublicConsent(
        document.cookie
            .split('; ')
            .find((item) => item.startsWith(`${CONSENT_COOKIE}=`))
            ?.split('=')[1],
    )
}
export const savePublicConsent = (analytics: boolean, ads: boolean) => {
    const previous = readPublicConsent()
    document.cookie = `${CONSENT_COOKIE}=v1.a${Number(analytics)}.m${Number(ads)}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
    window.dispatchEvent(new Event(CONSENT_EVENT))
    // Reload on withdrawal so already-running third-party code cannot remain active.
    if ((previous.analytics && !analytics) || (previous.ads && !ads)) {
        for (const entry of document.cookie.split('; ')) {
            const name = entry.split('=')[0] || ''
            if (!/^(_ga|_gid|_gat|_gcl_|_fbp)/.test(name)) continue
            for (const domain of ['', location.hostname, '.coreasia.id'])
                document.cookie = `${name}=; Path=/; Max-Age=0${domain ? `; Domain=${domain}` : ''}`
        }
        try {
            localStorage.removeItem('coreasia_lead_attribution_v2')
        } catch {
            /* Storage can be disabled. */
        }
        location.reload()
    }
}
let googleInitialized = false
export const updateGoogleConsent = () => {
    const choice = readPublicConsent()
    window.dataLayer ||= []
    if (!window.gtag)
        window.gtag = function () {
            // eslint-disable-next-line prefer-rest-params -- gtag requires an Arguments object.
            window.dataLayer!.push(arguments as unknown as Record<string, unknown>)
        }
    if (!googleInitialized) {
        window.gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
        })
        googleInitialized = true
    }
    window.gtag('consent', 'update', {
        analytics_storage: choice.analytics ? 'granted' : 'denied',
        ad_storage: choice.ads ? 'granted' : 'denied',
        ad_user_data: choice.ads ? 'granted' : 'denied',
        ad_personalization: choice.ads ? 'granted' : 'denied',
    })
}
