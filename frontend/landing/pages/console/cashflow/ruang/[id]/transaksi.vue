<script setup lang="ts">
/**
 * Ruang 360 › Transaksi — semua transaksi di ruang ini (admin_transaksi_cari
 * mode ruang; kolom Ruang diganti Pencatat). Isi tab di CashflowTabTransaksi.
 * ?cek= datang dari Pemeriksaan di tab Dompet.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { id, namaRuang, labelOrang } = useCashflowRuang()
</script>

<template>
  <CashflowTabTransaksi mode="ruang" :subjek="id" :nama-ruang="namaRuang" :label-orang="labelOrang" />
</template>
