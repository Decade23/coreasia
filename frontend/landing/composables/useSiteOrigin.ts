export const useSiteOrigin = () => {
  const config = useRuntimeConfig()
  const requestUrl = import.meta.server ? useRequestURL() : null

  return computed(() => {
    if (config.public?.siteUrl) {
      return config.public.siteUrl
    }

    if (import.meta.server && requestUrl) {
      return requestUrl.origin
    }

    if (typeof window !== 'undefined') {
      return window.location.origin
    }

    return 'http://localhost:3001'
  })
}
