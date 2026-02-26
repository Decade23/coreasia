<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

const { init: initTheme } = useTheme()

onMounted(() => {
  initTheme()
})

useHead({
  title: 'CoreAsia LMS — Certification Platform',
  meta: [
    { name: 'description', content: 'Digital Certification Platform' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap' }
  ]
})
</script>

<template>
  <NuxtPage />
</template>

<style>
:root {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* Nuxt 4 default transition */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
  filter: blur(1rem);
}
</style>
