<script setup lang="ts">
import { navigateTo } from '#app'

// Arahkan /admin langsung ke schemes karena itu halaman operasional utama saat ini
navigateTo('/admin/schemes')
</script>

<template>
  <div class="p-8 flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
  </div>
</template>
