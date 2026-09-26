<script setup lang="ts">
/**
 * Ruang 360 › Jadwal (daftar + laci ?jadwal=) — ranah `jadwal` (admin_jadwal_ruang, admin_jadwal_rinci, migrasi 0095).
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
  <CashflowPanelTab ranah="jadwal" aktivasi>
    <CashflowKeadaanKosong icon="lucide:hammer" :pesan="tcf('aktivasi.menyusul')" />
  </CashflowPanelTab>
</template>
