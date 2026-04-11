import { DEFAULT_LOCALE } from './i18n'
import EN_CONTENT from './content.en'
import ID_CONTENT from './content.id'

type SupportedContentLocale = 'id' | 'en'
export type CoreContent = typeof ID_CONTENT

const contentMap: Record<SupportedContentLocale, CoreContent> = {
  id: ID_CONTENT,
  en: EN_CONTENT,
}

const normalizeLocale = (locale: string = DEFAULT_LOCALE): SupportedContentLocale => {
  return locale === 'en' ? 'en' : 'id'
}

export const CONTENT = contentMap

export const getContent = (locale: string = DEFAULT_LOCALE) => {
  return contentMap[normalizeLocale(locale)] || ID_CONTENT
}

export const loadContent = async (locale: string = DEFAULT_LOCALE) => {
  return getContent(locale)
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