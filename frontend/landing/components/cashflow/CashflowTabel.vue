<script setup lang="ts">
/**
 * Bingkai tabel console CashFlow: kartu, bidang gulir samping, dan kaki untuk
 * paginasi atau keterangan. Isinya <thead> dan <tbody> biasa di slot bawaan.
 *
 * Rupa kepala kolom, baris, sorot, dan angka diatur sekali di
 * assets/css/cashflow-tema.css (kelas .cf-tabel), jadi tabel di halaman mana
 * pun tampil sama. Pembantu di dalam sel: `.cf-dua` baris kedua yang lebih
 * kecil, `.cf-ka` rata kanan untuk angka, `.cf-kuat` nilai utama.
 *
 * `lebarMin`: lebar terkecil tabel sebelum bidangnya bergulir ke samping.
 * `polos`: tanpa bingkai kartu, untuk tabel di dalam kartu lain.
 */
defineProps<{ lebarMin?: string; polos?: boolean; sibuk?: boolean }>()
</script>

<template>
  <div class="cf-tabel-wadah" :class="{ 'cf-tabel-polos': polos }">
    <div class="cf-tabel-gulir ca-scrollbar" :aria-busy="sibuk ? 'true' : undefined">
      <table class="cf-tabel" :style="lebarMin ? { minWidth: lebarMin } : undefined"><slot /></table>
    </div>
    <div v-if="$slots.kaki" class="cf-tabel-kaki"><slot name="kaki" /></div>
  </div>
</template>
