<script setup lang="ts" generic="T extends string">
/**
 * Pilihan bersegmen kecil (pola saringan Jenis di tab Transaksi): satu klik
 * mengganti nilai, tanpa dialog. aria-pressed menandai pilihan aktif.
 */
defineProps<{ opsi: ReadonlyArray<{ nilai: T; label: string }>; nilai: T; label?: string }>()
const emit = defineEmits<{ pilih: [nilai: T] }>()
</script>

<template>
  <div class="inline-flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm" role="group" :aria-label="label">
    <button
      v-for="o in opsi" :key="o.nilai" type="button"
      class="rounded-full px-3 py-1 transition"
      :class="nilai === o.nilai ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
      :aria-pressed="nilai === o.nilai" @click="emit('pilih', o.nilai)"
    >{{ o.label }}</button>
  </div>
</template>
