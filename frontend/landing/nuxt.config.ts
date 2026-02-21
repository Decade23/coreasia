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
        "@nuxtjs/tailwindcss",
        "@nuxtjs/seo",
        "@nuxt/fonts",
        "@nuxt/icon",
        "@nuxt/image",
    ],
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
            "Mitra Teknologi Strategis dan Platform LMS SaaS untuk Lembaga Pelatihan & Sertifikasi.",
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
                    rel: "icon",
                    type: "image/svg+xml",
                    href: asset("/logo.svg"),
                },
                { rel: "icon", href: asset("/logo.svg"), sizes: "any" },
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
                { name: "color-scheme", content: "dark" },
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
    tailwindcss: {
        cssPath: "~/assets/css/main.css",
    },
    image: {
        dir: "public",
    },
    routeRules: {
        // Landing page is static-first, revalidated every hour (SWR) or fully prerendered
        '/': { prerender: true },
        '/about': { prerender: true },
        '/contact': { prerender: true },
        '/solutions/**': { prerender: true },
        // API routes shouldn't be cached
        '/api/**': { cors: true },
    }
});
