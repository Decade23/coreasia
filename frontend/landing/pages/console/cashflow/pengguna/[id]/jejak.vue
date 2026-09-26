<script setup lang="ts">
/**
 * Pengguna 360 › Jejak — peristiwa yang DILAKUKAN subjek, di ruang lingkup
 * kasus. Isi tab ada di CashflowTabJejak (dipakai juga Ruang 360).
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  // Pindah tab subjek yang sama tidak melompat ke atas halaman (induk yang
  // menggulir ke baris tab bila perlu); subjek lain = halaman baru.
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { id, dasar, namaRuang } = useCashflowPengguna()
</script>

<template>
  <CashflowTabJejak mode="pengguna" :subjek="id" :dasar="dasar" :nama-ruang="namaRuang" />
</template>
