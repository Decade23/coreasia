<script setup lang="ts">
/**
 * Batang mendatar berurut — untuk corong dan "kategori teratas".
 *
 * Tiap baris: label kiri, batang proporsional, angka kanan, dan (opsional)
 * persen dari baris sebelumnya — itu yang membuat corong terbaca sebagai
 * corong: "8 dari 16 (50%)", bukan sekadar dua angka bersebelahan.
 * Lebar batang relatif terhadap baris PERTAMA, bukan maksimum, supaya corong
 * yang menyusut terlihat menyusut.
 */
const props = defineProps<{
  baris: Array<{ label: string; nilai: number; persen?: number | null; keterangan?: string }>
  warna?: string
}>()
const dasar = computed(() => Math.max(1, props.baris[0]?.nilai ?? 1))
</script>

<template>
  <ol class="space-y-2">
    <li v-for="(b, i) in baris" :key="i" class="grid grid-cols-[minmax(7rem,1fr)_3fr_auto] items-center gap-3 text-sm">
      <span class="truncate text-[var(--ca-text)]">{{ b.label }}</span>
      <span class="h-2.5 overflow-hidden rounded-full bg-[var(--ca-panel-bg-strong)]">
        <span
          class="block h-full rounded-full transition-[width]"
          :style="{ width: `${Math.max(2, Math.round((b.nilai / dasar) * 100))}%`, background: warna || 'var(--ca-accent, #d97706)' }"
        />
      </span>
      <span class="whitespace-nowrap text-right tabular-nums">
        <span class="font-semibold text-[var(--ca-text)]">{{ b.nilai }}</span>
        <span v-if="b.persen != null" class="ml-1 text-xs text-[var(--ca-subtle)]">({{ b.persen }}%)</span>
      </span>
      <span v-if="b.keterangan" class="col-span-3 -mt-1 text-xs text-[var(--ca-subtle)]">{{ b.keterangan }}</span>
    </li>
  </ol>
</template>
