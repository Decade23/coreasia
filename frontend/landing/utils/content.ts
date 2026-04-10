import { DEFAULT_LOCALE } from './i18n'
import ID_CONTENT from './content.id'

type SupportedContentLocale = 'id' | 'en'
export type CoreContent = typeof ID_CONTENT

const contentCache: Partial<Record<SupportedContentLocale, CoreContent>> = {
  id: ID_CONTENT,
}

const loadedLocales = new Set<SupportedContentLocale>(['id'])

const contentLoaders: Partial<Record<SupportedContentLocale, () => Promise<{ default: CoreContent }>>> = {
  en: () => import('./content.en'),
}

const normalizeLocale = (locale: string = DEFAULT_LOCALE): SupportedContentLocale => {
  return locale === 'en' ? 'en' : 'id'
}

export const CONTENT = contentCache

export const getContent = (locale: string = DEFAULT_LOCALE) => {
  const normalized = normalizeLocale(locale)
  return contentCache[normalized] || ID_CONTENT
}

export const loadContent = async (locale: string = DEFAULT_LOCALE) => {
  const normalized = normalizeLocale(locale)

  if (loadedLocales.has(normalized) && contentCache[normalized]) {
    return contentCache[normalized] as CoreContent
  }

  const loader = contentLoaders[normalized]
  if (!loader) {
    return ID_CONTENT
  }

  try {
    const module = await loader()
    contentCache[normalized] = module.default || ID_CONTENT
  } catch {
    contentCache[normalized] = ID_CONTENT
  }

  loadedLocales.add(normalized)

  return contentCache[normalized] || ID_CONTENT
}

export const getContentPath = (path: string, locale: string = DEFAULT_LOCALE) => {
  const content = getContent(locale)
  const pathParts = path.split('.')
  let result: any = content

  for (const part of pathParts) {
    result = result?.[part]
  }

  return result
}