<script setup lang="ts">
/**
 * Pengguna 360 › Transaksi — transaksi yang DICATAT subjek, di ruang lingkup
 * kasus. Isi tab ada di CashflowTabTransaksi (dipakai juga Ruang 360).
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  // Pindah tab subjek yang sama tidak melompat ke atas halaman (induk yang
  // menggulir ke baris tab bila perlu); subjek lain = halaman baru.
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { id, namaRuang } = useCashflowPengguna()
</script>

<template>
  <CashflowTabTransaksi mode="pengguna" :subjek="id" :nama-ruang="namaRuang" />
</template>
