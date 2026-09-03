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
    // Composable modul CashFlow hidup di subfolder sendiri supaya tidak
    // bercampur dengan composable console; Nuxt hanya memindai satu tingkat.
    imports: { dirs: ['composables/cashflow'] },
    // Blok `i18n: {...}` dihapus dari sini: @nuxtjs/i18n tidak terpasang (tidak ada di
    // modules maupun package.json), jadi konfigurasi itu tak pernah dibaca siapa pun dan
    // hanya menyesatkan — locale ditangani composables/useCoreI18n.ts.
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
        // URL artikel tidak lagi ditulis tangan di sini. Daftar manual membuat setiap
        // artikel baru dari admin console tak pernah masuk sitemap sampai ada yang
        // ingat mengedit berkas ini, jadi sumbernya dipindah ke rute server yang
        // membaca gateway (lihat server/api/__sitemap__/urls.ts).
        sources: ['/api/__sitemap__/urls'],
        urls: [
            { loc: '/', changefreq: 'weekly', priority: 1.0 },
            { loc: '/products', changefreq: 'weekly', priority: 0.9 },
            { loc: '/products/pantau', changefreq: 'weekly', priority: 0.82 },
            { loc: '/products/leadku', changefreq: 'weekly', priority: 0.82 },
            { loc: '/products/downloader', changefreq: 'weekly', priority: 0.85 },
            { loc: '/products/mounter', changefreq: 'weekly', priority: 0.85 },
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
                // Tidak ada og:image statis di sini. useSeoMeta hanya men-dedupe `og:image`,
                // sedangkan `og:image:width/height/type/secure_url` dari config bertahan dan
                // menempel ke gambar milik halaman lain, sehingga scraper pernah memakai
                // dimensi 500x500 (kartu kotak) untuk gambar 1200x630. Seluruh metadata
                // gambar sosial kini disetel satu paket di composables/useCoreSeo.ts.
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
        /* HANYA di server Nitro (tidak pernah masuk bundle klien — Nuxt hanya
           mengekspos `public`). Dipakai server/api/cashflow/sesi.post.ts untuk
           membuatkan sesi Supabase modul CashFlow dari cookie console yang
           sudah divalidasi ke gateway. Tanpa kunci ini modul menampilkan
           keadaan "belum dikonfigurasi", bukan galat. */
        cashflowSupabaseServiceKey: process.env.NUXT_CASHFLOW_SUPABASE_SERVICE_KEY || '',
        cashflowKonsolEmail: process.env.NUXT_CASHFLOW_KONSOL_EMAIL || 'konsol@coreasia.id',
        public: {
            /* Modul CashFlow di /console/cashflow berbicara LANGSUNG ke Supabase
               CashFlow dari peramban, bukan lewat gateway — datanya dijaga RPC
               ber-penjaga is_platform_admin() dan RLS. Sesinya dibuatkan server
               Nitro dari cookie console (lihat kunci non-public di atas); gateway
               sendiri tidak pernah memegang kunci Supabase. Anon key memang
               publik (tertanam di setiap APK); yang menjaga adalah RLS dan sesi,
               bukan kerahasiaan kunci ini. */
            cashflowSupabaseUrl: process.env.NUXT_PUBLIC_CASHFLOW_SUPABASE_URL || '',
            cashflowSupabaseAnonKey: process.env.NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY || '',
            gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:8081/api',
            gatewayPublicUrl: process.env.GATEWAY_PUBLIC_URL || process.env.GATEWAY_URL || 'http://localhost:8084/api',
            siteUrl: process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://coreasia.id',
            gtmId: process.env.NUXT_PUBLIC_GTM_ID || process.env.GTM_ID || '',
            googleAdsConversionId:
                process.env.NUXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID
                || process.env.GOOGLE_ADS_CONVERSION_ID
                || 'AW-18379615354',
            googleAdsLeadConversionLabel:
                process.env.NUXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL
                || process.env.GOOGLE_ADS_LEAD_CONVERSION_LABEL
                || '3qtKCPCF094cEPrYirxE',
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
                // CSP wajib mengizinkan host pencatat konversi Google Ads, bukan
                // hanya Tag Manager dan Analytics.
                //
                // Sebelum ini script-src hanya memuat googletagmanager dan
                // google-analytics, sehingga skrip viewthroughconversion dari
                // googleads.g.doubleclick.net DIBLOKIR, dan connect-src tidak
                // memuat ad.doubleclick.net sehingga panggilan pencatatnya ikut
                // diblokir. Akibatnya gtag termuat dan config terproses, tetapi
                // konversi tidak pernah sampai ke Google. Terlihat sehat di
                // permukaan, nol data di dasbor iklan, dan anggaran habis tanpa
                // satu pun konversi tercatat.
                //
                // Diverifikasi dari console peramban di produksi: kedua host itu
                // memang ditolak CSP saat halaman kontak dibuka dengan gclid.
                //
                // Jalur enhanced conversion (`/pagead/1p-conversion`) memakai
                // domain Google negara pengunjung, dan ccTLD tidak bisa diwakili
                // wildcard: `https://*.google.com` tidak mencakup google.com.sg.
                // Daftar di bawah menutup rute ASEAN yang realistis untuk trafik
                // Indonesia. Jalur konversi utamanya sendiri (googleadservices dan
                // googleads.g.doubleclick.net) tidak bergantung ccTLD, jadi ccTLD
                // yang belum terdaftar hanya kehilangan sinyal pencocokan, bukan
                // konversinya.
                //
                // worker-src disetel eksplisit. Tanpa direktif ini peramban jatuh ke
                // child-src lalu ke script-src, sehingga Web Worker dinilai dengan
                // aturan skrip halaman. canvas-confetti, yang memberi efek rayakan
                // saat brief terkirim, menyusun workernya sebagai Blob lalu
                // memuatnya dari URL blob:. Menambahkan blob: ke script-src akan
                // mengizinkan skrip blob apa pun berjalan di seluruh halaman, jalur
                // eskalasi XSS yang klasik; membatasinya di worker-src menutup risiko
                // itu dan hanya menyentuh worker.
                'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:8084 https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://stats.g.doubleclick.net https://www.google.com https://www.google.co.id https://www.google.com.sg https://www.google.com.my https://www.google.com.au https://*.coreasia.id https://api.coreasia.id https://fjoiivcyrznawbbnkkmn.supabase.co; frame-src 'self' https://www.googletagmanager.com https://td.doubleclick.net; frame-ancestors 'self'`,
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
        // Halaman marketing WAJIB tanpa cache rute Vercel. Dua bentuk sudah dicoba
        // dan dua-duanya membuang query string sebelum sampai ke renderer, sehingga
        // ?lang=en selalu keluar Bahasa Indonesia di sisi server:
        //   swr: 3600                                  -> ISR, expiration:false
        //   isr: { expiration, allowQuery: ['lang'] }  -> allowQuery TIDAK menolong
        // Terbukti di produksi: rute ber-ISR mengembalikan <html lang="id-ID"> untuk
        // ?lang=en, sementara /register dan /artikel yang ssr:true mengembalikan
        // "en-US". Konsekuensi yang diterima: tiap permintaan jadi invokasi fungsi.
        '/': { ssr: true },
        '/about': { ssr: true },
        '/contact': { ssr: true },
        '/products': { ssr: true },
        '/products/**': { ssr: true },
        '/partnerships': { ssr: true },
        '/solutions': { redirect: { to: '/solutions/venture', statusCode: 301 } },
        '/solutions/leadku': { redirect: { to: '/products/leadku', statusCode: 301 } },
        '/solutions/lms': { redirect: { to: '/products/lms', statusCode: 301 } },
        '/solutions/pantau': { redirect: { to: '/products/pantau', statusCode: 301 } },
        '/solutions/venture': { ssr: true },
        '/pricing': { ssr: true },
        '/faq': { ssr: true },
        '/portfolio': { ssr: true },
        '/privacy-policy': { ssr: true },
        '/terms': { ssr: true },
        '/layanan': { redirect: { to: '/layanan/jasa-pembuatan-website', statusCode: 301 } },
        '/layanan/**': { ssr: true },
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
