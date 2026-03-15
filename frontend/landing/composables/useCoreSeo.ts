import { useCoreI18n } from '~/composables/useCoreI18n'

interface CoreSeoOptions {
    title: string;
    description: string;
    path?: string;
    image?: string;
    twitterImage?: string;
    robots?: string;
    noindex?: boolean;
    ogType?: "website" | "article";
}

const SITE_URL = "https://coreasia.id";
const SITE_NAME = "CoreAsia Teknologi";
const DEFAULT_OG_IMAGE = "/social/og-image.png";
const DEFAULT_TWITTER_IMAGE = "/social/twitter-card.webp";
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

const toAbsoluteUrl = (path: string): string => {
    return new URL(normalizePath(path), SITE_URL).toString();
};

export const useCoreSeo = (options: CoreSeoOptions): void => {
    const route = useRoute();
    const { locale } = useCoreI18n();
    const routePath = normalizePath(options.path || route.path || "/");
    const localeMeta = LOCALE_META[locale.value as keyof typeof LOCALE_META] || LOCALE_META.id;
    const query = new URLSearchParams();

    if (locale.value !== "id") {
        query.set("lang", locale.value);
    }

    const canonicalPath = query.size > 0 ? `${routePath}?${query.toString()}` : routePath;
    const canonicalUrl = toAbsoluteUrl(canonicalPath);
    const imagePath = options.image || DEFAULT_OG_IMAGE;
    const socialImage = imagePath.startsWith("http")
        ? imagePath
        : toAbsoluteUrl(imagePath);
    const twitterImagePath = options.twitterImage || DEFAULT_TWITTER_IMAGE;
    const socialTwitterImage = twitterImagePath.startsWith("http")
        ? twitterImagePath
        : toAbsoluteUrl(twitterImagePath);

    const robots = options.noindex
        ? "noindex, nofollow"
        : options.robots || "index, follow, max-image-preview:large";

    useHead({
        link: [
            { rel: "canonical", href: canonicalUrl },
            { rel: "alternate", hreflang: LOCALE_META.id.hreflang, href: toAbsoluteUrl(routePath) },
            { rel: "alternate", hreflang: LOCALE_META.en.hreflang, href: toAbsoluteUrl(`${routePath}?lang=en`) },
            { rel: "alternate", hreflang: "x-default", href: toAbsoluteUrl(routePath) },
        ],
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
        ogImageAlt: `${SITE_NAME} preview`,
        twitterCard: "summary_large_image",
        twitterTitle: options.title,
        twitterDescription: options.description,
        twitterImage: socialTwitterImage,
    });
};
