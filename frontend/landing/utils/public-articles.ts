import { resolveArticleCover, safeArticleImage } from './article-assets'
export interface PublicArticle {
    id: string
    slug: string
    title: string
    description: string
    content: string
    category: string
    tags: string[]
    author: string
    read_time: number
    featured_image: string | null
    published_at: string
    created_at: string
    updated_at: string
}
export const articleCategory = (value: unknown) =>
    value === 'business' ? 'bisnis' : typeof value === 'string' ? value.trim().toLowerCase() : 'bisnis'
export const normalizePublicArticle = (value: unknown): PublicArticle | null => {
    if (!value || typeof value !== 'object') return null
    const item = value as Record<string, unknown>
    if (
        typeof item.slug !== 'string' ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) ||
        typeof item.title !== 'string' ||
        !item.title.trim()
    )
        return null
    if (item.status && item.status !== 'published') return null
  if (item.visibility && item.visibility !== 'public') return null
    const date = (v: unknown) => (typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : undefined)
    const published = date(item.published_at || item.publishedAt || item.created_at)
    if (!published || Date.parse(published) > Date.now()) return null
    const modified = date(item.updated_at || item.updatedAt)
    const readTime = Number(item.read_time || item.readTime)
    return {
        id: String(item.id || item.slug),
        slug: item.slug,
        title: item.title.trim(),
        description: typeof item.description === 'string' ? item.description : '',
        content: typeof item.content === 'string' ? item.content : '',
        category: articleCategory(item.category),
        tags: Array.isArray(item.tags) ? item.tags.filter((t): t is string => typeof t === 'string') : [],
        author: typeof item.author === 'string' && item.author.trim() ? item.author : 'Tim CoreAsia',
        read_time: Number.isFinite(readTime) ? Math.min(120, Math.max(1, Math.round(readTime))) : 5,
        featured_image: safeArticleImage(item.featured_image || item.featuredImage) || null,
        published_at: published,
        created_at: date(item.created_at) || published,
        updated_at: modified && Date.parse(modified) <= Date.now() ? modified : published,
    }
}
export const mergePublicArticles = (seed: unknown[], published: unknown[]): PublicArticle[] => {
    const records = new Map<string, PublicArticle>()
    for (const raw of [...seed, ...published]) {
        const item = normalizePublicArticle(raw)
        if (!item) continue
        const previous = records.get(item.slug)
        records.set(item.slug, { ...item, content: item.content || previous?.content || '' })
    }
    return [...records.values()].sort(
        (a, b) => Date.parse(b.published_at) - Date.parse(a.published_at) || a.slug.localeCompare(b.slug),
    )
}
export const articleImage = (article: PublicArticle) => resolveArticleCover(article)
