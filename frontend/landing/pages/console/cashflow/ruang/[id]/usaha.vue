<script setup lang="ts">
/**
 * Ruang 360 › Usaha (produk, stok kini, riwayat stok) — ranah `usaha` (admin_usaha_ruang, admin_stok_ruang, migrasi 0095).
 * FONDASI Fase 3: tab terdaftar, lencana dari hitung{}, ranah ditambah saat
 * tab diaktifkan pengguna (CashflowPanelTab aktivasi) atau lewat "Muat
 * data". Isi tab menyusul; sampai itu tidak ada RPC tab yang dipanggil.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { tcf } = useCashflowI18n()
</script>

<template>
  <CashflowPanelTab ranah="usaha" aktivasi>
    <CashflowKeadaanKosong icon="lucide:hammer" :pesan="tcf('aktivasi.menyusul')" />
  </CashflowPanelTab>
</template>
