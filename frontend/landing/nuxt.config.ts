// https://nuxt.com/docs/api/configuration/nuxt-config
const ASSET_VERSION = "20260210-2";
const asset = (path: string): string => `${path}?v=${ASSET_VERSION}`;

export default defineNuxtConfig({
    compatibilityDate: "2025-02-04",
    devtools: { enabled: process.env.NODE_ENV !== "production" },
    devServer: {
        host: '0.0.0.0',
        port: 3000
    },
    modules: [
        "@nuxtjs/seo",
        "@nuxt/fonts",
        "@nuxt/icon",
        "@nuxt/image",
        "@pinia/nuxt",
    ],
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
    ogImage: { enabled: false },
    css: ["~/assets/css/main.css"],
    vite: {
        plugins: [
            // @ts-expect-error - Tailwind CSS v4 Vite plugin
            (await import("@tailwindcss/vite")).default(),
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
        url: "https://coreasia.id",
        name: "CoreAsia Teknologi",
        description:
            "Mitra teknologi strategis dengan ekosistem produk digital untuk sertifikasi, monitoring web, CRM, dan kemitraan pertumbuhan.",
        defaultLocale: "id",
    },
    app: {
        head: {
            title: "CoreAsia Teknologi",
            htmlAttrs: {
                lang: "id",
            },
            link: [
                {
                    rel: "preconnect",
                    href: "https://www.googletagmanager.com",
                },
                {
                    rel: "dns-prefetch",
                    href: "https://www.googletagmanager.com",
                },
                {
                    rel: "icon",
                    type: "image/svg+xml",
                    href: asset("/logo.svg"),
                },
                {
                    rel: "icon",
                    type: "image/x-icon",
                    href: asset("/favicon.ico"),
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "16x16",
                    href: asset("/favicons/favicon-16.png"),
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "32x32",
                    href: asset("/favicons/favicon-32.png"),
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "192x192",
                    href: asset("/icons/android-chrome-192.png"),
                },
                {
                    rel: "shortcut icon",
                    href: asset("/favicons/favicon-32.png"),
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "48x48",
                    href: asset("/favicons/favicon-48.png"),
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "64x64",
                    href: asset("/favicons/favicon-64.png"),
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "96x96",
                    href: asset("/favicons/favicon-96.png"),
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "128x128",
                    href: asset("/favicons/favicon-128.png"),
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "60x60",
                    href: asset("/icons/apple-touch-icon-60.png"),
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "76x76",
                    href: asset("/icons/apple-touch-icon-76.png"),
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "120x120",
                    href: asset("/icons/apple-touch-icon-120.png"),
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "152x152",
                    href: asset("/icons/apple-touch-icon-152.png"),
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "167x167",
                    href: asset("/icons/apple-touch-icon-167.png"),
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "180x180",
                    href: asset("/icons/apple-touch-icon-180.png"),
                },
                {
                    rel: "apple-touch-icon",
                    href: asset("/icons/apple-touch-icon.png"),
                },
                {
                    rel: "mask-icon",
                    href: asset("/logo.svg"),
                    color: "#ffbe3d",
                },
                { rel: "manifest", href: asset("/site.webmanifest") },
            ],
            meta: [
                { name: "theme-color", content: "#050814" },
                { name: "color-scheme", content: "dark light" },
                { name: "msapplication-TileColor", content: "#050814" },
                { name: "msapplication-config", content: "/browserconfig.xml" },
                { name: "application-name", content: "CoreAsia" },
                { name: "apple-mobile-web-app-title", content: "CoreAsia" },
                { name: "apple-mobile-web-app-capable", content: "yes" },
                {
                    property: "og:site_name",
                    content: "CoreAsia Teknologi",
                },
                { property: "og:type", content: "website" },
                {
                    property: "og:image",
                    content: "https://coreasia.id/social/og-image.png",
                },
                {
                    property: "og:image:secure_url",
                    content: "https://coreasia.id/social/og-image.png",
                },
                { property: "og:image:type", content: "image/png" },
                { property: "og:image:width", content: "1200" },
                { property: "og:image:height", content: "630" },
                {
                    property: "og:image:alt",
                    content: "CoreAsia Teknologi preview",
                },
                {
                    property: "og:image",
                    content: "https://coreasia.id/social/linkedin-share.webp",
                },
                { property: "og:image:type", content: "image/webp" },
                { property: "og:image:width", content: "1200" },
                { property: "og:image:height", content: "627" },
                {
                    property: "og:image",
                    content: "https://coreasia.id/social/square-preview.webp",
                },
                { property: "og:image:type", content: "image/webp" },
                { property: "og:image:width", content: "500" },
                { property: "og:image:height", content: "500" },
                { name: "twitter:card", content: "summary_large_image" },
                {
                    name: "twitter:image",
                    content: "https://coreasia.id/social/twitter-card.webp",
                },
                {
                    name: "twitter:image:alt",
                    content: "CoreAsia Teknologi preview",
                },
            ],
            titleTemplate: "%s - CoreAsia Teknologi",
        },
    },
    schemaOrg: {
        identity: "Organization",
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
        dir: "public",
    },
    runtimeConfig: {
        public: {
            gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:8081/api',
            gatewayPublicUrl: process.env.GATEWAY_PUBLIC_URL || process.env.GATEWAY_URL || 'http://localhost:8084/api',
            gtmId: process.env.GTM_ID || '',
        },
    },
    nitro: {
        compressPublicAssets: { gzip: true, brotli: true },
    },
    routeRules: {
        // Default security headers
        '/**': {
            headers: {
                'X-Frame-Options': 'SAMEORIGIN',
                'X-Content-Type-Options': 'nosniff',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:8084 https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.coreasia.id https://api.coreasia.id; frame-ancestors 'self'`,
                'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            },
        },
        // Immutable cache for built assets
        '/_nuxt/**': {
            headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
        },
        // Landing page is static-first, revalidated every hour (SWR) or fully prerendered
        '/': { prerender: true },
        '/about': { prerender: true },
        '/contact': { prerender: true },
        '/products': { prerender: true },
        '/products/**': { prerender: true },
        '/partnerships': { prerender: true },
        '/solutions/venture': { prerender: true },
        '/pricing': { prerender: true },
        '/layanan/**': { prerender: true },
        '/artikel': { ssr: true },
        '/artikel/**': { ssr: true },
        '/console': { ssr: false },
        '/console/**': { ssr: false },
        '/register': { ssr: true },
        // API routes shouldn't be cached
        '/api/**': { cors: true },
    }
});
