<script setup lang="ts">
/**
 * Pengguna 360 › Dompet — dompet di semua ruang lingkup kasus
 * (admin_dompet_ruang p_ws null), dikelompokkan per ruang; ranah dompet
 * ditambahkan otomatis saat tab dibuka. Isi tab di CashflowTabDompet.
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { dasar, namaRuang } = useCashflowPengguna()
</script>

<template>
  <CashflowTabDompet mode="pengguna" :ws="null" :dasar="dasar" :nama-ruang="namaRuang" />
</template>
