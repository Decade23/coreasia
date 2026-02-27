// Navigation items with internationalization support
export const NAV_ITEMS = {
  id: [
    { label: 'Home', to: '/' },
    { label: 'SaaS LMS', to: '/solutions/lms' },
    { label: 'Venture', to: '/solutions/venture' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Tentang Kami', to: '/about' },
  ],
  en: [
    { label: 'Home', to: '/' },
    { label: 'SaaS LMS', to: '/solutions/lms' },
    { label: 'Venture', to: '/solutions/venture' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'About Us', to: '/about' },
  ],
} as const

// Helper to get navigation items for a locale
export const getNavItems = (locale: string = 'id') => {
  return NAV_ITEMS[locale as keyof typeof NAV_ITEMS] || NAV_ITEMS.id
}