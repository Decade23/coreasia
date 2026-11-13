<script setup lang="ts">
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { id, dasar } = useCashflowPengguna()
</script>

<template>
  <CashflowTabPerjalanan :subjek="id" :dasar="dasar" />
</template>
