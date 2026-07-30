import { useCoreI18n } from '~/composables/useCoreI18n'

interface CoreSeoOptions {
    title: string;
    description: string;
    path?: string;
    image?: string;
    twitterImage?: string;
    ogImageWidth?: number;
    ogImageHeight?: number;
    ogImageType?: string;
    ogImageSecureUrl?: string;
    robots?: string;
    noindex?: boolean;
    ogType?: "website" | "article";
}

const SITE_NAME = "CoreAsia Teknologi";
const DEFAULT_OG_IMAGE = "/social/og-image.png";
const DEFAULT_TWITTER_IMAGE = "/social/twitter-card.webp";
// Angka di bawah adalah dimensi asli DEFAULT_OG_IMAGE. Dimensi yang dideklarasikan
// wajib sama persis dengan berkasnya karena scraper memakai angka ini untuk memilih
// layout kartu tanpa mengunduh gambarnya: salah angka membuat gambar 1200x630
// tampil sebagai thumbnail kotak kecil.
const DEFAULT_OG_IMAGE_WIDTH = 1200;
const DEFAULT_OG_IMAGE_HEIGHT = 630;
const DEFAULT_OG_IMAGE_TYPE = "image/png";
const LOCALE_META = {
    id: {
        ogLocale: "id_ID",
        hreflang: "id-ID",
    },
    en: {
        ogLocale: "en_US",
        hreflang: "en-US",
    },
} as const;

const normalizePath = (path: string): string => {
    if (!path) {
        return "/";
    }

    return path.startsWith("/") ? path : `/${path}`;
};

const toAbsoluteUrl = (path: string, siteOrigin: string): string => {
    return new URL(normalizePath(path), siteOrigin).toString();
};

export const useCoreSeo = (options: CoreSeoOptions): void => {
    const route = useRoute();
    const { locale } = useCoreI18n();
    const siteOrigin = useSiteOrigin();
    const routePath = normalizePath(options.path || route.path || "/");
    const localeMeta = LOCALE_META[locale.value as keyof typeof LOCALE_META] || LOCALE_META.id;
    const query = new URLSearchParams();

    if (locale.value !== "id") {
        query.set("lang", locale.value);
    }

    const canonicalPath = query.size > 0 ? `${routePath}?${query.toString()}` : routePath;
    const canonicalUrl = toAbsoluteUrl(canonicalPath, siteOrigin.value);
    const imagePath = options.image || DEFAULT_OG_IMAGE;
    const socialImage = imagePath.startsWith("http")
        ? imagePath
        : toAbsoluteUrl(imagePath, siteOrigin.value);
    // twitter:image dulu punya jalur default sendiri sehingga useCoreSeo({ image })
    // tidak pernah mengubah kartu Twitter/X. Gambar halaman menang lebih dulu,
    // twitterImage eksplisit tetap dipertahankan untuk kasus aset khusus X.
    const twitterImagePath = options.twitterImage || options.image || DEFAULT_TWITTER_IMAGE;
    const socialTwitterImage = twitterImagePath.startsWith("http")
        ? twitterImagePath
        : toAbsoluteUrl(twitterImagePath, siteOrigin.value);
    // Dimensi hanya diklaim untuk gambar yang ukurannya kita tahu pasti: aset bawaan,
    // atau aset lain yang pemanggilnya menyebutkan ukurannya. Artikel dengan
    // featured_image bebas ukuran lebih baik tanpa klaim daripada salah klaim.
    const usesDefaultImage = !options.image;
    const ogImageWidth = options.ogImageWidth || (usesDefaultImage ? DEFAULT_OG_IMAGE_WIDTH : undefined);
    const ogImageHeight = options.ogImageHeight || (usesDefaultImage ? DEFAULT_OG_IMAGE_HEIGHT : undefined);
    const ogImageType = options.ogImageType || (usesDefaultImage ? DEFAULT_OG_IMAGE_TYPE : undefined);
    // secure_url ikut gambar yang benar-benar dipakai, bukan dipaku ke satu berkas,
    // dan hanya bermakna kalau originnya HTTPS (dev lokal berjalan di HTTP).
    const ogImageSecureUrl =
        options.ogImageSecureUrl || (socialImage.startsWith("https://") ? socialImage : undefined);

    const robots = options.noindex
        ? "noindex, nofollow"
        : options.robots || "index, follow, max-image-preview:large";

    useHead({
        link: [
            { rel: "canonical", href: canonicalUrl },
            { rel: "alternate", hreflang: LOCALE_META.id.hreflang, href: toAbsoluteUrl(routePath, siteOrigin.value) },
            { rel: "alternate", hreflang: LOCALE_META.en.hreflang, href: toAbsoluteUrl(`${routePath}?lang=en`, siteOrigin.value) },
            { rel: "alternate", hreflang: "x-default", href: toAbsoluteUrl(routePath, siteOrigin.value) },
        ],
        // og:image:type lewat useHead karena tipe ogImageType milik unhead baru
        // memuat png/jpeg/gif, sedangkan sebagian kartu sosial kami berformat WebP.
        meta: ogImageType ? [{ property: "og:image:type", content: ogImageType }] : [],
    });

    useSeoMeta({
        title: options.title,
        description: options.description,
        robots,
        googlebot: robots,
        ogTitle: options.title,
        ogDescription: options.description,
        ogType: options.ogType || "website",
        ogUrl: canonicalUrl,
        ogSiteName: SITE_NAME,
        ogLocale: localeMeta.ogLocale,
        ogImage: socialImage,
        ...(ogImageSecureUrl ? { ogImageSecureUrl } : {}),
        ...(ogImageWidth ? { ogImageWidth } : {}),
        ...(ogImageHeight ? { ogImageHeight } : {}),
        ogImageAlt: `${SITE_NAME} preview`,
        twitterCard: "summary_large_image",
        twitterTitle: options.title,
        twitterDescription: options.description,
        twitterImage: socialTwitterImage,
    });
};
