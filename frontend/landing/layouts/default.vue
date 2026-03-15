<script setup lang="ts">
const { theme } = useCoreTheme()

useHead(() => ({
  htmlAttrs: {
    'data-theme': theme.value,
  },
  meta: [
    {
      name: 'theme-color',
      content: theme.value === 'light' ? '#f6f1e8' : '#050814',
    },
  ],
}))
</script>

<template>
  <div class="ca-page-shell relative min-h-screen overflow-hidden font-sans text-[var(--ca-text)]">
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute inset-0 ca-grid-bg opacity-[0.08]" />
      <div class="absolute -top-28 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[var(--ca-orb-primary)] blur-[140px]" />
      <div class="absolute bottom-[-8rem] right-[-5rem] h-[24rem] w-[24rem] rounded-full bg-[var(--ca-orb-secondary)] blur-[120px]" />
    </div>
    <TheHeader />
    <main id="main-content" class="relative">
      <slot />
    </main>
    <TheFooter />
    <ClientOnly>
      <BackToTop />
    </ClientOnly>
  </div>
</template>
