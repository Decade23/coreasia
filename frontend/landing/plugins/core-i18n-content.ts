import { DEFAULT_LOCALE } from '~/utils/i18n'
import { getContent, loadContent } from '~/utils/content'

const LOCALE_QUERY_KEY = 'lang'

const resolveLocaleFromRoute = (route: ReturnType<typeof useRoute>) => {
  const queryValue = Array.isArray(route.query[LOCALE_QUERY_KEY])
    ? route.query[LOCALE_QUERY_KEY][0]
    : route.query[LOCALE_QUERY_KEY]

  return queryValue === 'en' ? 'en' : DEFAULT_LOCALE
}

export default defineNuxtPlugin(async (nuxtApp) => {
  const route = useRoute()
  const contentState = useState('coreasia-content', () => getContent(DEFAULT_LOCALE))

  const syncContent = async () => {
    contentState.value = await loadContent(resolveLocaleFromRoute(route))
  }

  await syncContent()

  if (import.meta.client) {
    nuxtApp.hook('page:finish', syncContent)
  }
})