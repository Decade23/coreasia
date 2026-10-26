import { publicArticleCatalog } from '~/server/lib/public-articles'
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const articles = await publicArticleCatalog(String(config.public.gatewayUrl))
    setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=60')
    return { data: articles.map(({ content: _content, ...summary }) => summary) }
})
