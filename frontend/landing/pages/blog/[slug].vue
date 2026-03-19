<script setup lang="ts">
// Redirect /blog/:slug → /artikel/:slug
const route = useRoute()
navigateTo(`/artikel/${route.params.slug}`, { redirectCode: 301 })
</script>

<template>
  <div />
</template>
