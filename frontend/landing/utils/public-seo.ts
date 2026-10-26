export const publicLocales = (path: string) =>
    path === '/artikel' || path.startsWith('/artikel/') || path.startsWith('/portfolio/') ? ['id'] : ['id', 'en']
export const publicCanonical = (origin: string, path: string, locale: string, available = publicLocales(path)) => {
    const url = new URL(path.startsWith('/') ? path : `/${path}`, origin)
    url.search = ''
    url.hash = ''
    if (locale === 'en' && available.includes('en')) url.searchParams.set('lang', 'en')
    return url.href
}
export const stringifyJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')
export const publicSocialImages: Record<string, string> = {
    '/layanan/jasa-pembuatan-website': '/articles/jenis-website-1200.webp',
    '/layanan/jasa-pembuatan-aplikasi-web': '/articles/brief-aplikasi-1200.webp',
    '/layanan/web-monitoring-dashboard': '/articles/web-monitoring-1200.webp',
    '/products/build': '/articles/software-house-1200.webp',
    '/products/pantau': '/articles/web-monitoring-1200.webp',
    '/products/downloader': '/articles/download-manager-1200.webp',
    '/products/beres': '/articles/rapikan-unduhan-1200.webp',
    '/pricing': '/articles/biaya-website-1200.webp',
}
