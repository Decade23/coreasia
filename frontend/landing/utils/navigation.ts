import { getContent } from './content'

export interface NavItem {
  label: string
  to: string
}

export const getNavItems = (locale: string = 'id'): NavItem[] => {
  const content = getContent(locale)

  return [
    { label: content.nav.home, to: '/' },
    { label: content.nav.products, to: '/products' },
    { label: content.nav.services, to: '/layanan/jasa-pembuatan-website' },
    { label: content.nav.partnerships, to: '/partnerships' },
    { label: content.nav.pricing, to: '/pricing' },
    { label: content.nav.articles, to: '/artikel' },
    { label: content.nav.about, to: '/about' },
  ]
}
