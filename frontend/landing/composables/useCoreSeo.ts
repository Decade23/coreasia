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
    const routePath = normalizePath(options.path || route.path || "/");
    const canonicalUrl = toAbsoluteUrl(routePath);
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
        link: [{ rel: "canonical", href: canonicalUrl }],
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
        ogLocale: "id_ID",
        ogImage: socialImage,
        ogImageAlt: `${SITE_NAME} preview`,
        twitterCard: "summary_large_image",
        twitterTitle: options.title,
        twitterDescription: options.description,
        twitterImage: socialTwitterImage,
    });
};
