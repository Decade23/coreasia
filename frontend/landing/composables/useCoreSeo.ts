import { toValue, type MaybeRefOrGetter } from 'vue'
import { publicCanonical, publicLocales, publicSocialImages } from '~/utils/public-seo'

interface CoreSeoOptions {
    title: string
    description: string
    path?: string
    image?: string
    twitterImage?: string
    ogImageWidth?: number
    ogImageHeight?: number
    ogImageType?: string
    ogImageSecureUrl?: string
    robots?: string
    noindex?: boolean
    ogType?: 'website' | 'article'
    imageAlt?: string
}

export const useCoreSeo = (input: MaybeRefOrGetter<CoreSeoOptions>): void => {
    const route = useRoute()
    const { locale } = useCoreI18n()
    const origin = useSiteOrigin()
    const seo = computed(() => {
        const options = toValue(input)
        const path = options.path || route.path || '/'
        const available = publicLocales(path)
        const language = available.includes(locale.value) ? locale.value : 'id'
        const canonical = publicCanonical(origin.value, path, language, available)
        const image = options.image || publicSocialImages[path] || '/social/og-image.png'
        const absolute = (asset: string) => new URL(asset, origin.value).href
        const knownImage = !options.image || /^\/(?:articles\/[-a-z]+-1200\.webp|social\/articles\/[-a-z]+\.jpg)$/.test(image)
        return {
            ...options,
            path,
            available,
            language,
            canonical,
            image: absolute(image),
            twitter: absolute(options.twitterImage || image),
            width: options.ogImageWidth || (knownImage ? 1200 : undefined),
            height: options.ogImageHeight || (knownImage ? 630 : undefined),
            type:
                options.ogImageType ||
                (image.endsWith('.webp') ? 'image/webp' : image.endsWith('.png') ? 'image/png' : /\.jpe?g$/.test(image) ? 'image/jpeg' : undefined),
            robots: options.noindex ? 'noindex, nofollow' : options.robots || 'index, follow, max-image-preview:large',
        }
    })
    useHead(() => ({
        link: [
            { rel: 'canonical', href: seo.value.canonical },
            ...seo.value.available.map((language) => ({
                rel: 'alternate',
                hreflang: language === 'en' ? 'en-US' : 'id-ID',
                href: publicCanonical(origin.value, seo.value.path, language, seo.value.available),
            })),
            {
                rel: 'alternate',
                hreflang: 'x-default',
                href: publicCanonical(origin.value, seo.value.path, 'id', seo.value.available),
            },
        ],
        meta: seo.value.type ? [{ property: 'og:image:type', content: seo.value.type }] : [],
    }))
    useSeoMeta({
        title: () => seo.value.title,
        description: () => seo.value.description,
        robots: () => seo.value.robots,
        googlebot: () => seo.value.robots,
        ogTitle: () => seo.value.title,
        ogDescription: () => seo.value.description,
        ogType: () => seo.value.ogType || 'website',
        ogUrl: () => seo.value.canonical,
        ogSiteName: 'CoreAsia Teknologi',
        ogLocale: () => (seo.value.language === 'en' ? 'en_US' : 'id_ID'),
        ogImage: () => seo.value.image,
        ogImageSecureUrl: () => (seo.value.image.startsWith('https:') ? seo.value.image : undefined),
        ogImageWidth: () => seo.value.width,
        ogImageHeight: () => seo.value.height,
        ogImageAlt: () => seo.value.imageAlt || seo.value.title,
        twitterCard: 'summary_large_image',
        twitterTitle: () => seo.value.title,
        twitterDescription: () => seo.value.description,
        twitterImage: () => seo.value.twitter,
    })
}
