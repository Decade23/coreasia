<script setup lang="ts">
/**
 * Ruang 360 › Akses — siapa membuka data ruang ini (admin_riwayat_akses
 * target = ruang; T0, tanpa kasus, tanpa audit). Isi tab di CashflowTabAkses.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { tcf } = useCashflowI18n()
const { id } = useCashflowRuang()
</script>

<template>
  <CashflowTabAkses :subjek="id" :ket="tcf('r360.aksesKet')" :kosong="tcf('r360.aksesKosong')" />
</template>
