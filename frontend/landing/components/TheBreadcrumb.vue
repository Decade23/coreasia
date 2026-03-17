<script setup lang="ts">
const { t } = useCoreI18n()
const route = useRoute()

interface BreadcrumbItem {
  label: string
  to?: string
}

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const segments = route.path.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = [{ label: t('nav.home') as string, to: '/' }]

  const labelMap: Record<string, () => string> = {
    products: () => t('nav.products') as string,
    partnerships: () => t('nav.partnerships') as string,
    solutions: () => t('nav.solutions') as string,
    pricing: () => t('nav.pricing') as string,
    about: () => t('nav.about') as string,
    contact: () => t('nav.contact') as string,
    pantau: () => 'Pantau',
    build: () => 'Build',
    lms: () => 'LMS',
    leadku: () => 'LeadKu',
    venture: () => 'Venture',
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

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: breadcrumbs.value.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.to ? `https://coreasia.id${item.to}` : undefined,
    })),
  }),
])
</script>

<template>
  <nav
    v-if="breadcrumbs.length > 1"
    aria-label="Breadcrumb"
    class="ca-container py-3"
  >
    <ol class="flex flex-wrap items-center gap-1 text-xs text-[var(--ca-muted)] sm:text-sm">
      <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center gap-1">
        <Icon
          v-if="index > 0"
          name="lucide:chevron-right"
          class="h-3 w-3 text-[var(--ca-subtle)]"
        />
        <NuxtLink
          v-if="crumb.to"
          :to="crumb.to"
          class="transition hover:text-[var(--ca-text)]"
        >
          {{ crumb.label }}
        </NuxtLink>
        <span
          v-else
          class="font-medium text-[var(--ca-text)]"
        >
          {{ crumb.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
