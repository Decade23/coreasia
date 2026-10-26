import { publicArticleBySlug } from '~/server/lib/public-articles'
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const article = await publicArticleBySlug(String(config.public.gatewayUrl), getRouterParam(event, 'slug') || '')
    if (!article) throw createError({ statusCode: 404, statusMessage: 'Article not found' })
    setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=60')
    return { data: article }
})
