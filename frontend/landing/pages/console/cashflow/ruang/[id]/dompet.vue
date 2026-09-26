<script setup lang="ts">
/**
 * Ruang 360 › Dompet — dompet + saldo, mutasi, dan Pemeriksaan (tautan ke
 * tab Transaksi ?cek=). Isi tab di CashflowTabDompet.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { id, dasar, namaRuang, labelOrang } = useCashflowRuang()
</script>

<template>
  <CashflowTabDompet mode="ruang" :ws="id" :dasar="dasar" :nama-ruang="namaRuang" :label-orang="labelOrang" />
</template>
