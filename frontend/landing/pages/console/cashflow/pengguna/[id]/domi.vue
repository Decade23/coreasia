<script setup lang="ts">
/**
 * Pengguna 360 › Domi AI — percakapan pengguna dengan Domi (T3 lewat kasus
 * anak otomatis, audit per pembukaan). Isi tab di CashflowTabDomi.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { id } = useCashflowPengguna()
</script>

<template>
  <CashflowTabDomi :user="id" />
</template>
