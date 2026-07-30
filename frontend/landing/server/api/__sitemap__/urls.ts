import type { SitemapUrlInput } from '#sitemap/types'
import { ARTICLES } from '~/utils/articles'

interface GatewayArticle {
    slug?: string
    published_at?: string | null
    updated_at?: string | null
}

interface GatewayArticleList {
    data?: GatewayArticle[] | null
    meta?: { total?: number } | null
}

const PER_PAGE = 100
// Batas halaman supaya rute ini tidak pernah berubah jadi antrean permintaan panjang
// kalau suatu saat jumlah artikel meledak atau meta.total dari gateway ngawur.
const MAX_PAGES = 10

/**
 * Sumber URL artikel untuk sitemap.
 *
 * Sebelum ini slug artikel ditulis tangan di nuxt.config.ts, jadi artikel baru dari
 * admin console tidak pernah masuk sitemap sampai ada orang yang ingat menambahkannya.
 * Rute ini dibaca @nuxtjs/sitemap lewat `sitemap.sources`. Sitemap situs ini dirender
 * saat permintaan (bukan saat build, karena kami memakai `nuxt build` bukan `generate`),
 * jadi daftarnya selalu ikut isi database tanpa perlu deploy ulang.
 */
export default defineSitemapEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const gatewayUrl = config.public?.gatewayUrl || 'http://localhost:8081/api'

    // Artikel statis di utils/articles.ts jadi lantai dasar: kalau gateway mati atau
    // lambat, sitemap tetap memuat artikel yang sudah terbit. Kunci Map = slug supaya
    // artikel yang ada di dua sumber tidak muncul dua kali.
    const urls = new Map<string, SitemapUrlInput>()

    for (const article of ARTICLES) {
        urls.set(article.slug, {
            loc: `/artikel/${article.slug}`,
            lastmod: article.publishedAt,
            changefreq: 'monthly',
            priority: 0.6,
        })
    }

    try {
        for (let page = 1; page <= MAX_PAGES; page++) {
            const res = await $fetch<GatewayArticleList>(`${gatewayUrl}/articles`, {
                query: { page, per_page: PER_PAGE },
                timeout: 2500,
            })

            const items = res?.data || []
            for (const item of items) {
                if (!item?.slug) {
                    continue
                }

                urls.set(item.slug, {
                    loc: `/artikel/${item.slug}`,
                    lastmod: item.updated_at || item.published_at || undefined,
                    changefreq: 'monthly',
                    priority: 0.6,
                })
            }

            const total = res?.meta?.total ?? items.length
            if (items.length < PER_PAGE || page * PER_PAGE >= total) {
                break
            }
        }
    } catch (error) {
        // Sengaja tidak melempar. Sitemap yang ketinggalan beberapa artikel masih jauh
        // lebih berguna daripada sitemap yang gagal dirender karena gateway sedang mati.
        console.warn('[sitemap] gagal mengambil artikel publik dari gateway', error)
    }

    return [...urls.values()]
})
