<script setup lang="ts">
useHead({
  title: 'CoreAsia LMS — Certification Platform',
  meta: [
    { name: 'description', content: 'Digital Certification Platform' }
  ]
})
</script>

<template>
  <NuxtPage />
</template>

<style>
/* Nuxt 4 default transition */
.page-enter-active,
.page-leave-active {
  transition: all 0.2s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
