const covers: Record<string, [string, string]> = {
    'apa-itu-web-monitoring-dan-mengapa-bisnis-membutuhkannya': [
        'web-monitoring',
        'Ilustrasi membaca grafik pengunjung dan memantau kondisi website',
    ],
    'panduan-memilih-software-house-indonesia': [
        'software-house',
        'Ilustrasi diskusi kebutuhan website dan peninjauan rencana pengerjaan',
    ],
    'cara-meningkatkan-seo-website-bisnis': [
        'seo-bisnis',
        'Ilustrasi struktur halaman website yang saling terhubung dan mudah ditemukan',
    ],
    'download-manager-untuk-mac-apa-itu-dan-kapan-membutuhkannya': [
        'download-manager',
        'Ilustrasi pengelolaan antrean unduhan berkas di laptop',
    ],
    'cara-mempercepat-download-di-macbook': ['download-cepat', 'Ilustrasi aliran unduhan dari jaringan menuju laptop'],
    'cara-download-banyak-file-sekaligus-di-mac': [
        'download-banyak',
        'Ilustrasi beberapa tautan berkas yang masuk ke antrean unduhan',
    ],
    'download-gagal-atau-terputus-di-mac-penyebab-dan-solusi': [
        'download-terputus',
        'Ilustrasi melanjutkan unduhan setelah sambungan jaringan terputus',
    ],
    'cara-merapikan-file-unduhan-di-mac-otomatis': [
        'rapikan-unduhan',
        'Ilustrasi berkas unduhan yang dikelompokkan ke folder sesuai jenisnya',
    ],
    'berapa-biaya-pembuatan-website-perusahaan': [
        'biaya-website',
        'Ilustrasi menyusun kebutuhan dan anggaran pembuatan website',
    ],
    'landing-page-company-profile-atau-toko-online': [
        'jenis-website',
        'Ilustrasi perbedaan landing page, website perusahaan dan toko online',
    ],
    'cara-menyusun-kebutuhan-aplikasi-web-custom': [
        'brief-aplikasi',
        'Ilustrasi menyusun alur kerja dan kebutuhan aplikasi web',
    ],
}

export const safeArticleImage = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return
    const src = value.trim()
    if (
        src.startsWith('/') &&
        !src.startsWith('//') &&
        !src.includes('\\') &&
        ![...src].some((char) => char.charCodeAt(0) < 32)
    )
        return src
    try {
        const url = new URL(src)
        if (url.protocol === 'https:' && !url.username && !url.password) return url.href
    } catch {
        /* Invalid URLs fall back to a local illustration. */
    }
}

export interface ArticleCoverInput {
    slug?: string
    title?: string
    featured_image?: string | null
    featuredImage?: string | null
}
export const resolveArticleCover = (article: ArticleCoverInput) => {
    const editorImage = safeArticleImage(article.featured_image || article.featuredImage)
    if (editorImage)
        return {
            src: editorImage,
            socialSrc: editorImage,
            alt: article.title || 'Gambar artikel',
            generated: false,
            srcset: undefined,
            width: undefined,
            height: undefined,
        }
    const [name, alt] = covers[article.slug || ''] || ['software-house', 'Ilustrasi perencanaan dan pengerjaan website']
    return {
        src: `/articles/${name}-1200.webp`,
        socialSrc: `/social/articles/${name}.jpg`,
        alt,
        generated: true,
        srcset: [480, 800, 1200].map((w) => `/articles/${name}-${w}.webp ${w}w`).join(', '),
        width: 1200,
        height: 630,
    }
}

export const ARTICLE_ASSET_SLUGS = Object.keys(covers)
