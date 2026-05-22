// https://nuxt.com/docs/api/configuration/nuxt-config
const ASSET_VERSION = '20260522-1'
const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://coreasia.id'
const asset = (path: string): string => `${path}?v=${ASSET_VERSION}`
const absoluteSiteAsset = (path: string): string => new URL(path, SITE_URL).toString()

export default defineNuxtConfig({
    compatibilityDate: '2025-02-04',
    devtools: { enabled: process.env.NODE_ENV !== 'production' },
    devServer: {
        host: '0.0.0.0',
        port: 3000,
    },
    experimental: {
        browserDevtoolsTiming: false,
    },
    modules: ['@nuxtjs/seo', '@nuxt/eslint', '@nuxt/fonts', '@nuxt/icon', '@nuxt/image', '@pinia/nuxt'],
    i18n: {
        strategy: 'no_prefix',
        defaultLocale: 'id',
        locales: [
            { code: 'id', iso: 'id-ID' },
            { code: 'en', iso: 'en-US' },
        ],
        pages: undefined,
        skipSettingLocaleOnNavigate: true,
        detectBrowserLanguage: false,
    },
    ogImage: { enabled: true },
    robots: {
        disallow: ['/console', '/console/', '/register', '/maintenance', '/404', '/500'],
        allow: [
            '/favicon.ico',
            '/logo.svg',
            '/favicons/',
            '/icons/',
            '/logos/',
            '/social/',
            '/artikel/',
            '/layanan/',
            '/products/',
        ],
    },
    sitemap: {
        exclude: ['/console', '/console/**', '/blog', '/blog/**', '/404', '/500', '/maintenance', '/register'],
        defaults: {
            changefreq: 'weekly' as const,
            priority: 0.7,
        },
        urls: [
            { loc: '/', changefreq: 'weekly', priority: 1.0 },
            { loc: '/products', changefreq: 'weekly', priority: 0.9 },
            { loc: '/products/pantau', changefreq: 'weekly', priority: 0.82 },
            { loc: '/products/leadku', changefreq: 'weekly', priority: 0.82 },
            { loc: '/products/lms', changefreq: 'monthly', priority: 0.72 },
            { loc: '/products/build', changefreq: 'monthly', priority: 0.72 },
            { loc: '/layanan/jasa-pembuatan-website', changefreq: 'weekly', priority: 0.9 },
            { loc: '/layanan/jasa-pembuatan-aplikasi-web', changefreq: 'weekly', priority: 0.84 },
            { loc: '/layanan/web-monitoring-dashboard', changefreq: 'weekly', priority: 0.84 },
            { loc: '/pricing', changefreq: 'weekly', priority: 0.8 },
            { loc: '/partnerships', changefreq: 'monthly', priority: 0.72 },
            { loc: '/portfolio', changefreq: 'monthly', priority: 0.72 },
            { loc: '/about', changefreq: 'monthly', priority: 0.75 },
            { loc: '/contact', changefreq: 'monthly', priority: 0.72 },
            { loc: '/faq', changefreq: 'monthly', priority: 0.65 },
            { loc: '/artikel', changefreq: 'weekly', priority: 0.8 },
            // Dynamic article URLs (static data from utils/articles.ts)
            {
                loc: '/artikel/apa-itu-web-monitoring-dan-mengapa-bisnis-membutuhkannya',
                changefreq: 'monthly',
                priority: 0.6,
            },
            { loc: '/artikel/panduan-memilih-software-house-indonesia', changefreq: 'monthly', priority: 0.6 },
            { loc: '/artikel/cara-meningkatkan-seo-website-bisnis', changefreq: 'monthly', priority: 0.6 },
        ],
    },
    css: ['~/assets/css/main.css'],
    vite: {
        plugins: [
            // @ts-expect-error - Tailwind CSS v4 Vite plugin
            (await import('@tailwindcss/vite')).default(),
        ],
        optimizeDeps: {
            include: [
                '@tiptap/vue-3',
                '@tiptap/starter-kit',
                '@tiptap/extension-image',
                '@tiptap/extension-link',
                '@tiptap/extension-placeholder',
                '@tiptap/extension-text-align',
                '@tiptap/extension-underline',
                '@vueuse/core',
                'canvas-confetti',
            ],
        },
    },
    components: [
        {
            path: '~/components',
            pathPrefix: false,
        },
    ],
    site: {
        url: SITE_URL,
        name: 'CoreAsia Teknologi',
        description:
            'Mitra teknologi strategis dengan ekosistem produk digital untuk sertifikasi, monitoring web, CRM, dan kemitraan pertumbuhan.',
        defaultLocale: 'id',
    },
    app: {
        head: {
            title: 'CoreAsia Teknologi',
            link: [
                {
                    rel: 'preconnect',
                    href: 'https://www.googletagmanager.com',
                },
                {
                    rel: 'dns-prefetch',
                    href: 'https://www.googletagmanager.com',
                },
                {
                    rel: 'icon',
                    type: 'image/x-icon',
                    sizes: 'any',
                    href: asset('/favicon.ico'),
                },
                {
                    rel: 'icon',
                    type: 'image/png',
                    sizes: '48x48',
                    href: asset('/favicons/favicon-48.png'),
                },
                {
                    rel: 'icon',
                    type: 'image/png',
                    sizes: '64x64',
                    href: asset('/favicons/favicon-64.png'),
                },
                {
                    rel: 'icon',
                    type: 'image/png',
                    sizes: '96x96',
                    href: asset('/favicons/favicon-96.png'),
                },
                {
                    rel: 'icon',
                    type: 'image/svg+xml',
                    href: asset('/logo.svg'),
                },
                {
                    rel: 'apple-touch-icon',
                    sizes: '60x60',
                    href: asset('/icons/apple-touch-icon-60.png'),
                },
                {
                    rel: 'apple-touch-icon',
                    sizes: '76x76',
                    href: asset('/icons/apple-touch-icon-76.png'),
                },
                {
                    rel: 'apple-touch-icon',
                    sizes: '120x120',
                    href: asset('/icons/apple-touch-icon-120.png'),
                },
                {
                    rel: 'apple-touch-icon',
                    sizes: '152x152',
                    href: asset('/icons/apple-touch-icon-152.png'),
                },
                {
                    rel: 'apple-touch-icon',
                    sizes: '167x167',
                    href: asset('/icons/apple-touch-icon-167.png'),
                },
                {
                    rel: 'apple-touch-icon',
                    sizes: '180x180',
                    href: asset('/icons/apple-touch-icon-180.png'),
                },
                {
                    rel: 'apple-touch-icon',
                    href: asset('/icons/apple-touch-icon.png'),
                },
                {
                    rel: 'mask-icon',
                    href: asset('/logo.svg'),
                    color: '#ffbe3d',
                },
                { rel: 'manifest', href: asset('/site.webmanifest') },
            ],
            meta: [
                { name: 'theme-color', content: '#050814' },
                { name: 'color-scheme', content: 'dark light' },
                { name: 'msapplication-TileColor', content: '#050814' },
                { name: 'msapplication-config', content: '/browserconfig.xml' },
                { name: 'application-name', content: 'CoreAsia' },
                { name: 'apple-mobile-web-app-title', content: 'CoreAsia' },
                { name: 'apple-mobile-web-app-capable', content: 'yes' },
                {
                    property: 'og:site_name',
                    content: 'CoreAsia Teknologi',
                },
                { property: 'og:type', content: 'website' },
                {
                    property: 'og:image',
                    content: absoluteSiteAsset('/social/og-image.png'),
                },
                {
                    property: 'og:image:secure_url',
                    content: absoluteSiteAsset('/social/og-image.png'),
                },
                { property: 'og:image:type', content: 'image/png' },
                { property: 'og:image:width', content: '1200' },
                { property: 'og:image:height', content: '630' },
                {
                    property: 'og:image:alt',
                    content: 'CoreAsia Teknologi preview',
                },
                {
                    property: 'og:image',
                    content: absoluteSiteAsset('/social/linkedin-share.webp'),
                },
                { property: 'og:image:type', content: 'image/webp' },
                { property: 'og:image:width', content: '1200' },
                { property: 'og:image:height', content: '627' },
                {
                    property: 'og:image',
                    content: absoluteSiteAsset('/social/square-preview.webp'),
                },
                { property: 'og:image:type', content: 'image/webp' },
                { property: 'og:image:width', content: '500' },
                { property: 'og:image:height', content: '500' },
                { name: 'twitter:card', content: 'summary_large_image' },
                {
                    name: 'twitter:image',
                    content: absoluteSiteAsset('/social/twitter-card.webp'),
                },
                {
                    name: 'twitter:image:alt',
                    content: 'CoreAsia Teknologi preview',
                },
            ],
            titleTemplate: '%s - CoreAsia Teknologi',
        },
    },
    schemaOrg: {
        identity: 'Organization',
    },

    fonts: {
        families: [
            { name: 'Plus Jakarta Sans', provider: 'google', weights: [400, 500, 600, 700, 800] },
            { name: 'Space Grotesk', provider: 'google', weights: [500, 600, 700] },
        ],
        defaults: {
            weights: [400, 500, 600, 700],
        },
    },

    image: {
        dir: 'public',
        quality: 80,
        formats: ['webp', 'avif'],
    },
    runtimeConfig: {
        public: {
            gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:8081/api',
            gatewayPublicUrl: process.env.GATEWAY_PUBLIC_URL || process.env.GATEWAY_URL || 'http://localhost:8084/api',
            siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://coreasia.id',
            gtmId: process.env.NUXT_PUBLIC_GTM_ID || process.env.GTM_ID || '',
            googleSiteVerification:
                process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION || '',
        },
    },
    nitro: {
        compressPublicAssets: { gzip: true, brotli: true },
        timing: false,
        prerender: {
            concurrency: 1,
        },
    },
    routeRules: {
        // Default security headers
        '/**': {
            headers: {
                'X-Frame-Options': 'SAMEORIGIN',
                'X-Content-Type-Options': 'nosniff',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:8084 https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.coreasia.id https://api.coreasia.id; frame-src 'self' https://www.googletagmanager.com; frame-ancestors 'self'`,
                'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            },
        },
        // Immutable cache for built assets
        '/_nuxt/**': {
            headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
        },
        '/favicon.ico': {
            headers: { 'Cache-Control': 'public, max-age=86400, must-revalidate' },
        },
        '/favicons/**': {
            headers: { 'Cache-Control': 'public, max-age=86400, must-revalidate' },
        },
        '/icons/**': {
            headers: { 'Cache-Control': 'public, max-age=86400, must-revalidate' },
        },
        '/logos/**': {
            headers: { 'Cache-Control': 'public, max-age=86400, must-revalidate' },
        },
        '/social/**': {
            headers: { 'Cache-Control': 'public, max-age=86400, must-revalidate' },
        },
        '/site.webmanifest': {
            headers: { 'Cache-Control': 'public, max-age=86400, must-revalidate' },
        },
        '/browserconfig.xml': {
            headers: { 'Cache-Control': 'public, max-age=86400, must-revalidate' },
        },
        // Marketing pages stay SSR so ?lang=en works, with SWR caching for one hour
        '/': { swr: 3600 },
        '/about': { swr: 3600 },
        '/contact': { swr: 3600 },
        '/products': { swr: 3600 },
        '/products/**': { swr: 3600 },
        '/partnerships': { swr: 3600 },
        '/solutions': { redirect: { to: '/solutions/venture', statusCode: 301 } },
        '/solutions/leadku': { redirect: { to: '/products/leadku', statusCode: 301 } },
        '/solutions/lms': { redirect: { to: '/products/lms', statusCode: 301 } },
        '/solutions/pantau': { redirect: { to: '/products/pantau', statusCode: 301 } },
        '/solutions/venture': { swr: 3600 },
        '/pricing': { swr: 3600 },
        '/faq': { swr: 3600 },
        '/portfolio': { swr: 3600 },
        '/privacy-policy': { swr: 3600 },
        '/terms': { swr: 3600 },
        '/layanan': { redirect: { to: '/layanan/jasa-pembuatan-website', statusCode: 301 } },
        '/layanan/**': { swr: 3600 },
        '/blog': { redirect: { to: '/artikel', statusCode: 301 } },
        '/artikel': { ssr: true },
        '/artikel/**': { ssr: true },
        '/console': { ssr: false, index: false, robots: false },
        '/console/**': { ssr: false, index: false, robots: false },
        '/register': { ssr: true },
        // API routes shouldn't be cached
        '/api/**': { cors: true },
    },
})
