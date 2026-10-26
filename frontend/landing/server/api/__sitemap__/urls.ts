import { publicArticleCatalog } from '~/server/lib/public-articles'
export default defineSitemapEventHandler(async event => {
  const config = useRuntimeConfig(event)
  const articles = await publicArticleCatalog(String(config.public.gatewayUrl))
  return articles.map(article => ({ loc: `/artikel/${article.slug}`, lastmod: article.updated_at || article.published_at }))
})
