<script setup lang="ts">
/**
 * Pengguna 360 › Akses — siapa melihat data orang ini. Isi tab ada di
 * CashflowTabAkses (dipakai juga Ruang 360).
 */
definePageMeta({
  layout: 'console',
  middleware: ['console', 'cashflow-admin'],
  // Pindah tab subjek yang sama tidak melompat ke atas halaman (induk yang
  // menggulir ke baris tab bila perlu); subjek lain = halaman baru.
  scrollToTop: (to, from) => to.params.id !== from.params.id,
})
const { tcf } = useCashflowI18n()
const { id } = useCashflowPengguna()
</script>

<template>
  <CashflowTabAkses :subjek="id" :ket="tcf('akses.ket')" :kosong="tcf('akses.kosong')" />
</template>
