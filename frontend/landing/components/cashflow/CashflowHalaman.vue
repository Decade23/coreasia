<script setup lang="ts">
/**
 * Pager daftar console CashFlow (paginasi di klien, maksimal 500 baris).
 *
 * Hanya tampilan: halaman yang benar (sudah dijepit) dan jumlahnya dihitung
 * pemanggil dari SELURUH baris yang sudah disaring dan diurut. Pager ini tidak
 * tahu apa-apa soal data, jadi tidak bisa menghitung dari halaman yang tampil.
 */
const props = defineProps<{ hal: number; jumlahHalaman: number; total: number; per: number }>()
const emit = defineEmits<{ ganti: [hal: number] }>()
const { tcf } = useCashflowI18n()

const dari = computed(() => (props.total ? (props.hal - 1) * props.per + 1 : 0))
const sampai = computed(() => Math.min(props.total, props.hal * props.per))
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ca-muted)]">
    <span class="tabular-nums">{{ tcf('umum.rentang')(dari, sampai, total) }}</span>
    <div v-if="jumlahHalaman > 1" class="flex items-center gap-2">
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="hal <= 1" @click="emit('ganti', hal - 1)">
        {{ tcf('umum.sebelumnya') }}
      </button>
      <span class="tabular-nums">{{ tcf('umum.halaman')(hal, jumlahHalaman) }}</span>
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="hal >= jumlahHalaman" @click="emit('ganti', hal + 1)">
        {{ tcf('umum.berikutnya') }}
      </button>
    </div>
  </div>
</template>
