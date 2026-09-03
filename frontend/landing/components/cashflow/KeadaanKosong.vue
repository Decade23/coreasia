<script setup lang="ts">
/**
 * Keadaan kosong yang JUJUR. Pada 16 pengguna, banyak grafik nyaris kosong;
 * grafik nyaris kosong terbaca sebagai rusak, angka yang jujur tidak.
 * FallbackState.vue milik console dirancang untuk halaman pemeliharaan
 * (progress, highlights) — terlalu berat untuk satu kartu, jadi ini yang dipakai.
 */
withDefaults(defineProps<{ pesan: string; icon?: string }>(), { icon: 'lucide:inbox' })
</script>

<template>
  <div class="flex items-center gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]">
    <Icon :name="icon" class="h-5 w-5 shrink-0 text-[var(--ca-subtle)]" />
    <span>{{ pesan }}</span>
  </div>
</template>
