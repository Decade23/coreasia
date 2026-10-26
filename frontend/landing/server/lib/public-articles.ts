import { ARTICLES } from '~/utils/articles'
import { mergePublicArticles, normalizePublicArticle } from '~/utils/public-articles'

const remoteCatalog = defineCachedFunction(
    async (baseURL: string): Promise<unknown[]> => {
        const items: unknown[] = []
        for (let page = 1; page <= 10; page++) {
            const res = await $fetch<{ data?: unknown[] | null; meta?: { total?: number } }>(`${baseURL}/articles`, {
                query: { page, per_page: 100 },
                timeout: 1200,
                retry: 0,
            })
            const batch = Array.isArray(res?.data) ? res.data : []
            items.push(...batch)
            if (batch.length < 100 || page * 100 >= (res.meta?.total ?? items.length)) break
        }
        return items
    },
    {
        name: 'public-articles',
        maxAge: 60,
        swr: false,
        getKey: (baseURL: string) => baseURL.replace(/[^a-z0-9]/gi, '_'),
    },
)

export const publicArticleCatalog = async (baseURL: string) => {
    let remote: unknown[] = []
    try {
        remote = await remoteCatalog(baseURL)
    } catch {
        /* Authored public articles remain available during a gateway outage. */
    }
    return mergePublicArticles(ARTICLES, remote)
}
export const publicArticleBySlug = async (baseURL: string, slug: string) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
    const catalog = await publicArticleCatalog(baseURL)
    const fallback = catalog.find((item) => item.slug === slug)
    // Static content is deterministic in SSR and hydration. A published CMS overlay
    // already has its full content when present; fetch detail only when necessary.
    if (fallback?.content) return fallback
    try {
        const res = await $fetch<{ data?: unknown }>(`${baseURL}/articles/${encodeURIComponent(slug)}`, {
            timeout: 1500,
            retry: 0,
        })
        return normalizePublicArticle(res?.data)
    } catch {
        return fallback || null
    }
}
