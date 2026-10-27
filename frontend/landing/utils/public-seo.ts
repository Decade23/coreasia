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
    '/layanan/jasa-pembuatan-website': '/social/articles/jenis-website.jpg',
    '/layanan/jasa-pembuatan-aplikasi-web': '/social/articles/brief-aplikasi.jpg',
    '/layanan/web-monitoring-dashboard': '/social/articles/web-monitoring.jpg',
    '/products/build': '/social/articles/software-house.jpg',
    '/products/pantau': '/social/articles/web-monitoring.jpg',
    '/products/downloader': '/social/articles/download-manager.jpg',
    '/products/beres': '/social/articles/rapikan-unduhan.jpg',
    '/pricing': '/social/articles/biaya-website.jpg',
}
