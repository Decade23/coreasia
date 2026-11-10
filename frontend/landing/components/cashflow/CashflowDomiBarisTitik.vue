<script setup lang="ts">
/** Satu baris "label ...... nilai" di atas kertas. */
defineProps<{ kiri: string; kanan: string; warna?: 'mint' | 'rose' }>()
</script>

<template>
  <div class="domi-baris" :class="warna ? `domi-baris-${warna}` : ''">
    <span class="domi-baris-kiri">{{ kiri }}</span>
    <span class="domi-baris-titik" aria-hidden="true" />
    <span class="domi-baris-kanan">{{ kanan }}</span>
  </div>
</template>

<style scoped>
.domi-baris { display: flex; align-items: baseline; font-size: 13.5px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--d-txt); }
.domi-baris-kiri { min-width: 0; overflow-wrap: anywhere; }
.domi-baris-kanan { flex-shrink: 0; }
.domi-baris-titik { flex: 1; min-width: 10px; border-bottom: 1.5px dotted var(--d-garis); margin: 0 6px; transform: translateY(-3px); }
.domi-baris-mint { color: var(--d-mint); }
.domi-baris-rose { color: var(--d-rose); }
</style>
