<script setup lang="ts">
/**
 * Ruang 360 › Jejak — semua peristiwa di ruang ini (admin_jejak tanpa
 * aktor). Tujuan tombol Selidiki di /aktivitas. Isi tab di CashflowTabJejak.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { id, dasar, namaRuang, labelOrang } = useCashflowRuang()
</script>

<template>
  <CashflowTabJejak mode="ruang" :subjek="id" :dasar="dasar" :nama-ruang="namaRuang" :label-orang="labelOrang" />
</template>
