<script setup lang="ts">
/**
 * Pager keyset (?kursor=, push): "Berikutnya" menambah entri riwayat,
 * "Sebelumnya" = Back bila entri sebelumnya memang halaman sebelumnya di
 * daftar ini, selain itu kembali ke halaman pertama. Total hanya dihitung
 * server di halaman pertama; pemanggil meneruskannya.
 */
const props = defineProps<{ halamanPertama: boolean; adaBerikut: boolean; jumlah: number; total: number | null; memuat?: boolean }>()
const emit = defineEmits<{ sebelumnya: []; berikutnya: []; pertama: [] }>()
const { tcf } = useCashflowI18n()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ca-muted)]">
    <span class="tabular-nums">
      {{ total != null ? tcf('kursor.dariTotal')(jumlah, total) : tcf('kursor.baris')(jumlah) }}
    </span>
    <div class="flex items-center gap-2">
      <button v-if="!halamanPertama" type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat" @click="emit('pertama')">{{ tcf('kursor.pertama') }}</button>
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat || halamanPertama" :title="'['" @click="emit('sebelumnya')">{{ tcf('umum.sebelumnya') }}</button>
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat || !adaBerikut" :title="']'" @click="emit('berikutnya')">{{ tcf('umum.berikutnya') }}</button>
    </div>
  </div>
</template>
