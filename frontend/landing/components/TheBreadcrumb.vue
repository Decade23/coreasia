<script setup lang="ts">
const { t } = useCoreI18n()
const route = useRoute()
const siteUrl = useSiteOrigin()

interface BreadcrumbItem {
  label: string
  to?: string
}

const isHomePage = computed(() => route.path === '/' || route.path === '')

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  if (isHomePage.value) return []

  const segments = route.path.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = [{ label: t('nav.home') as string, to: '/' }]

  const labelMap: Record<string, () => string> = {
    products: () => t('nav.products') as string,
    partnerships: () => t('nav.partnerships') as string,
    solutions: () => t('nav.solutions') as string,
    pricing: () => t('nav.pricing') as string,
    about: () => t('nav.about') as string,
    contact: () => t('nav.contact') as string,
    artikel: () => t('nav.articles') as string,
    pantau: () => 'Pantau',
    build: () => 'Build',
    lms: () => 'LMS',
    leadku: () => 'LeadKu',
    venture: () => 'Venture',
    layanan: () => t('nav.services') as string,
    'jasa-pembuatan-website': () => 'Jasa Pembuatan Website',
    'jasa-pembuatan-aplikasi-web': () => 'Jasa Pembuatan Aplikasi Web',
    'web-monitoring-dashboard': () => 'Web Monitoring Dashboard',
    register: () => 'Register',
    'privacy-policy': () => 'Privacy Policy',
    terms: () => 'Terms of Service',
  }

  let path = ''
  segments.forEach((segment, index) => {
    path += `/${segment}`
    const isLast = index === segments.length - 1
    const label = labelMap[segment]?.() || segment.charAt(0).toUpperCase() + segment.slice(1)
    items.push({
      label,
      to: isLast ? undefined : path,
    })
  })

  return items
})

const breadcrumbSchema = computed(() => {
  if (breadcrumbs.value.length < 2) {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${siteUrl.value}${route.path}#breadcrumb`,
    itemListElement: breadcrumbs.value.map((item, index) => {
      const itemPath = item.to || route.path

      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: `${siteUrl.value}${itemPath}`,
      }
    }),
  }
})

useHead(() => ({
  script: breadcrumbSchema.value
    ? [
        {
          key: 'breadcrumb-schema',
          type: 'application/ld+json',
          innerHTML: JSON.stringify(breadcrumbSchema.value),
        },
      ]
    : [],
}))
</script>

<template>
  <nav
    v-if="breadcrumbs.length > 1"
    aria-label="Breadcrumb"
    class="relative z-40 border-b border-[var(--ca-border)]/40 bg-[var(--ca-bg)]/85 backdrop-blur-md"
  >
    <div class="ca-container py-2">
      <ol class="flex flex-wrap items-center gap-1.5 text-[0.6rem] font-semibold tracking-widest uppercase sm:text-[0.65rem]">
        <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center gap-1.5">
          <Icon
            v-if="index > 0"
            name="lucide:chevron-right"
            class="h-2.5 w-2.5 text-[var(--ca-subtle)] opacity-40"
          />
          <NuxtLink
            v-if="crumb.to"
            :to="crumb.to"
            class="text-[var(--ca-muted)] opacity-70 transition hover:opacity-100 hover:text-[var(--ca-text)]"
          >
            {{ crumb.label }}
          </NuxtLink>
          <span
            v-else
            class="text-[var(--ca-text)] opacity-80"
          >
            {{ crumb.label }}
          </span>
        </li>
      </ol>
    </div>
  </nav>
</template>
