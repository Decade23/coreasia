<script setup lang="ts">
const config = useRuntimeConfig()
const gtmId = computed(() => {
  const value = config.public.gtmId as string | undefined
  return value?.trim() || ''
})
</script>

<template>
  <noscript v-if="gtmId">
    <iframe
      :src="`https://www.googletagmanager.com/ns.html?id=${gtmId}`"
      height="0"
      width="0"
      style="display:none;visibility:hidden"
      title="Google Tag Manager"
    />
  </noscript>
</template>